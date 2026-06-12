import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: { order: true },
  })
  if (!report || report.status !== 'pending') {
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: params.id },
      data: { status: 'approved', resolvedAt: new Date() },
    })

    await tx.order.update({
      where: { id: report.orderId },
      data: { status: 'refunded' },
    })

    await tx.account.update({
      where: { id: report.accountId },
      data: { status: 'pending' }, // put back to pending
    })

    const updatedBuyer = await tx.user.update({
      where: { id: report.buyerId },
      data: { balance: { increment: report.order.amount } },
    })

    await tx.transaction.create({
      data: {
        userId: report.buyerId,
        type: 'refund',
        amount: report.order.amount,
        balance: updatedBuyer.balance,
        description: `Refund for disputed order`,
        orderId: report.orderId,
      },
    })

    await tx.notification.create({
      data: {
        userId: report.buyerId,
        title: 'Dispute Resolved - Refunded ✅',
        message: `Your dispute has been approved. ৳${report.order.amount} has been refunded to your balance.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/reports', req.url))
}
