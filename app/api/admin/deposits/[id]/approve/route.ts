import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'
import { logStaffAction } from '@/lib/staffAudit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'deposits'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deposit = await prisma.topupRequest.findUnique({ where: { id: params.id } })
  if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if (deposit.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    await tx.topupRequest.update({
      where: { id: params.id },
      data: { status: 'approved', processedAt: new Date() },
    })

    const updatedUser = await tx.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    })

    await tx.transaction.create({
      data: {
        userId: deposit.userId,
        type: 'topup',
        amount: deposit.amount,
        balance: updatedUser.balance,
        description: `Wallet add money via ${deposit.method.toUpperCase()} (TrxID: ${deposit.transactionId || 'N/A'})`,
        topupId: deposit.id,
      },
    })

    await tx.notification.create({
      data: {
        userId: deposit.userId,
        title: 'Add Money Approved',
        message: `BDT ${deposit.amount} has been added to your wallet.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })
  await logStaffAction(authUser, 'deposit.approve', 'deposit', deposit.id, { amount: deposit.amount, method: deposit.method, transactionId: deposit.transactionId }, req)

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
