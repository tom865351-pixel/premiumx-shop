import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/review — submit a review for purchased account
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, rating, comment } = await req.json()
  if (!orderId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { account: true }
  })

  if (!order || order.buyerId !== authUser.userId) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed orders' }, { status: 400 })
  }

  // Check if already reviewed
  const existing = await prisma.review.findUnique({ where: { orderId } })
  if (existing) {
    return NextResponse.json({ error: 'Already reviewed this order' }, { status: 400 })
  }

  await prisma.review.create({
    data: {
      userId: authUser.userId,
      accountId: order.accountId,
      orderId,
      rating,
      comment: comment || null,
    }
  })

  return NextResponse.json({ success: true })
}
