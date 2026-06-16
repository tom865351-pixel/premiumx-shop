import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'
import { releaseSellerPayout } from '@/lib/orders'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'reports'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await prisma.report.findUnique({ where: { id: params.id } })
  if (!report || report.status !== 'pending') {
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: params.id },
      data: { status: 'rejected', resolvedAt: new Date() },
    })

    await releaseSellerPayout(tx, report.orderId)

    await tx.notification.create({
      data: {
        userId: report.buyerId,
        title: 'Dispute Rejected',
        message: 'Your dispute report has been reviewed and rejected. The order stands as completed.',
        type: 'danger',
        link: '/orders',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/reports', req.url))
}
