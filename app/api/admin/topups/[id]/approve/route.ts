import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'deposits'))) {
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
        description: `Wallet add money via ${topup.method.toUpperCase()}`,
        topupId: topup.id,
      },
    })

    await tx.notification.create({
      data: {
        userId: topup.userId,
        title: 'Add Money Approved',
        message: `BDT ${topup.amount} has been approved and added to your balance.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
