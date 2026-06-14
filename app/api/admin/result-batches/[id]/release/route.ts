import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let batch
  try {
    batch = await prisma.resultBatch.findUnique({
      where: { id: params.id },
      include: { rows: true },
    })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }
  if (!batch || batch.status === 'rolled_back') return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const pendingRows = batch.rows.filter((row) => row.pending && !row.credited && row.accountId && row.sellerId)
  try {
    await prisma.$transaction(async (tx) => {
    for (const row of pendingRows) {
      const updatedSeller = await tx.user.update({
        where: { id: row.sellerId! },
        data: { balance: { increment: row.price } },
      })
      await tx.transaction.create({
        data: {
          userId: row.sellerId!,
          type: 'sale',
          amount: row.price,
          balance: updatedSeller.balance,
          description: `Pending bulk result payout released for ${row.username}`,
        },
      })
      await tx.resultRow.update({ where: { id: row.id }, data: { credited: true, pending: false } })
    }
    if (pendingRows.length > 0) {
      await tx.resultBatch.update({
        where: { id: batch.id },
        data: { creditedAmount: { increment: pendingRows.reduce((sum, row) => sum + row.price, 0) }, pendingAmount: 0 },
      })
    }
    })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }

  return NextResponse.redirect(new URL('/admin/result-batches', req.url))
}
