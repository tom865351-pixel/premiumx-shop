import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deposit = await prisma.topupRequest.findUnique({ where: { id: params.id } })
  if (!deposit || deposit.userId !== user.userId || deposit.status !== 'pending') {
    return NextResponse.json({ error: 'Add money request not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.topupRequest.update({
      where: { id: deposit.id },
      data: {
        status: 'cancelled',
        adminNote: 'Cancelled by user',
        processedAt: new Date(),
      },
    })

    await tx.notification.create({
      data: {
        userId: user.userId,
        title: 'Add Money Request Cancelled',
        message: `Your add money request of BDT ${deposit.amount} was cancelled.`,
        type: 'info',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/wallet', req.url))
}
