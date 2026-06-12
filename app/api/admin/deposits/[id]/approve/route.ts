import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deposit = await prisma.topupRequest.findUnique({ where: { id: params.id } })
  if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if (deposit.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    // 1. Update TopupRequest status
    await tx.topupRequest.update({
      where: { id: params.id },
      data: { status: 'approved', processedAt: new Date() }
    })

    // 2. Add balance to user wallet
    const updatedUser = await tx.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } }
    })

    // 3. Create transaction log
    await tx.transaction.create({
      data: {
        userId: deposit.userId,
        type: 'topup',
        amount: deposit.amount,
        balance: updatedUser.balance,
        description: `Wallet Top-up via ${deposit.method.toUpperCase()} (TrxID: ${deposit.transactionId})`,
        topupId: deposit.id,
      }
    })

    // 4. Notify user
    await tx.notification.create({
      data: {
        userId: deposit.userId,
        title: '✅ Deposit Approved!',
        message: `৳${deposit.amount} has been added to your wallet. Enjoy shopping!`,
        type: 'success',
        link: '/wallet',
      }
    })
  })

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
