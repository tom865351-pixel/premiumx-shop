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

  const { note } = await req.json().catch(() => ({ note: '' }))

  await prisma.topupRequest.update({
    where: { id: params.id },
    data: { status: 'rejected', adminNote: note || 'Invalid Transaction ID', processedAt: new Date() }
  })

  await prisma.notification.create({
    data: {
      userId: deposit.userId,
      title: '❌ Deposit Rejected',
      message: `Your deposit of ৳${deposit.amount} was rejected. Reason: ${note || 'Invalid Transaction ID'}. Contact support if you believe this is an error.`,
      type: 'danger',
      link: '/deposit',
    }
  })

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
