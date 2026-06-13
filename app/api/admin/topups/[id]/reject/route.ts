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

  await prisma.topupRequest.update({
    where: { id: params.id },
    data: { status: 'rejected', processedAt: new Date() },
  })

  await prisma.notification.create({
    data: {
      userId: topup.userId,
      title: 'Add Money Rejected',
      message: `Your add money request of BDT ${topup.amount} was rejected. Please contact support.`,
      type: 'danger',
      link: '/wallet',
    },
  })

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
