import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, method, accountNumber } = await req.json()

  if (!amount || !method || !accountNumber) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount < 100) {
    return NextResponse.json({ error: 'Minimum withdrawal is ৳100' }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (dbUser.balance < numAmount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  await prisma.withdrawal.create({
    data: {
      userId: user.userId,
      amount: numAmount,
      method,
      accountNumber,
      status: 'pending',
    },
  })

  await prisma.notification.create({
    data: {
      userId: user.userId,
      title: 'Withdrawal Request Submitted ✅',
      message: `Your withdrawal request of ৳${numAmount} via ${method} has been submitted. Admin will process it shortly.`,
      type: 'info',
      link: '/wallet',
    },
  })

  return NextResponse.json({ success: true })
}
