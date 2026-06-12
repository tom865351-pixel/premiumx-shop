import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } })
  if (!withdrawal || withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.update({
      where: { id: params.id },
      data: { status: 'rejected', processedAt: new Date() },
    })

    // Refund balance
    const updatedUser = await tx.user.update({
      where: { id: withdrawal.userId },
      data: { balance: { increment: withdrawal.amount } },
    })

    await tx.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: 'refund',
        amount: withdrawal.amount,
        balance: updatedUser.balance,
        description: `Withdrawal rejected - amount refunded`,
        withdrawalId: withdrawal.id,
      },
    })

    await tx.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Rejected ❌',
        message: `Your withdrawal of ৳${withdrawal.amount} was rejected. Balance has been refunded.`,
        type: 'warning',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/withdrawals', req.url))
}
