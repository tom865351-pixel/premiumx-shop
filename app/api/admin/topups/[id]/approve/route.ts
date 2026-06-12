import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const topup = await prisma.topupRequest.findUnique({ where: { id: params.id } })
  if (!topup || topup.status !== 'pending') {
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.topupRequest.update({
      where: { id: params.id },
      data: { status: 'approved', processedAt: new Date() },
    })

    const updatedUser = await tx.user.update({
      where: { id: topup.userId },
      data: { balance: { increment: topup.amount } },
    })

    await tx.transaction.create({
      data: {
        userId: topup.userId,
        type: 'topup',
        amount: topup.amount,
        balance: updatedUser.balance,
        description: `Topup via ${topup.method}`,
        topupId: topup.id,
      },
    })

    await tx.notification.create({
      data: {
        userId: topup.userId,
        title: 'Topup Approved! ✅',
        message: `Your topup of ৳${topup.amount} has been approved and added to your balance.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/payments', req.url))
}
