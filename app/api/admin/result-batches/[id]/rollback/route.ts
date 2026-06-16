import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'
import { canAccessAdminArea } from '@/lib/permissions'
import { logStaffAction } from '@/lib/staffAudit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let batch
  try {
    batch = await prisma.resultBatch.findUnique({ where: { id: params.id }, include: { rows: true } })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }
  if (!batch || batch.status === 'rolled_back') return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  try {
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
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }

  await logStaffAction(user, 'result_batch.rollback', 'resultBatch', batch.id, { rows: batch.rows.length }, req)
  return NextResponse.redirect(new URL('/admin/result-batches', req.url))
}
