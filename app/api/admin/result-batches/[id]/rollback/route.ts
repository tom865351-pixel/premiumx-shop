import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const batch = await prisma.resultBatch.findUnique({ where: { id: params.id }, include: { rows: true } })
  if (!batch || batch.status === 'rolled_back') return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    for (const row of batch.rows) {
      if (row.accountId && row.previousStatus) {
        await tx.account.update({ where: { id: row.accountId }, data: { status: row.previousStatus } })
      }
      if (row.credited && row.sellerId) {
        const updatedSeller = await tx.user.update({
          where: { id: row.sellerId },
          data: { balance: { decrement: row.price } },
        })
        await tx.transaction.create({
          data: {
            userId: row.sellerId,
            type: 'refund',
            amount: -row.price,
            balance: updatedSeller.balance,
            description: `Rollback bulk result payout for ${row.username}`,
          },
        })
      }
    }
    await tx.resultBatch.update({ where: { id: batch.id }, data: { status: 'rolled_back', rolledBackAt: new Date() } })
  })

  return NextResponse.redirect(new URL('/admin/result-batches', req.url))
}
