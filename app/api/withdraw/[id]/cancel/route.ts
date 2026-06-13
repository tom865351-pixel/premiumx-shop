import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } })
  if (!withdrawal || withdrawal.userId !== user.userId || withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Withdrawal not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    const reserveTx = await tx.transaction.findUnique({
      where: { withdrawalId: withdrawal.id },
    })

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'cancelled',
        adminNote: 'Cancelled by seller',
        processedAt: new Date(),
      },
    })

    if (reserveTx) {
      const updatedUser = await tx.user.update({
        where: { id: user.userId },
        data: { balance: { increment: withdrawal.amount } },
      })

      await tx.transaction.create({
        data: {
          userId: user.userId,
          type: 'refund',
          amount: withdrawal.amount,
          balance: updatedUser.balance,
          description: `Withdrawal cancelled - BDT ${withdrawal.amount} returned to wallet`,
        },
      })
    }

    await tx.notification.create({
      data: {
        userId: user.userId,
        title: 'Withdrawal Cancelled',
        message: `Your withdrawal request of BDT ${withdrawal.amount} was cancelled and returned to your wallet.`,
        type: 'info',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/wallet', req.url))
}
