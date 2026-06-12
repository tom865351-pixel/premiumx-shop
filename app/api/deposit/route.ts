import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, method, transactionId } = await req.json()

    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Minimum deposit is ৳50' }, { status: 400 })
    }
    if (!method || !['bkash', 'nagad', 'rocket'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    if (!transactionId || transactionId.trim().length < 4) {
      return NextResponse.json({ error: 'Valid Transaction ID is required' }, { status: 400 })
    }

    // Check for duplicate TrxID
    const existing = await prisma.topupRequest.findFirst({
      where: { transactionId: transactionId.trim() }
    })
    if (existing) {
      return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 400 })
    }

    const deposit = await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount: parseFloat(amount),
        method,
        transactionId: transactionId.trim(),
        status: 'pending',
      }
    })

    // Notify admin (create admin notification)
    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        title: 'Deposit Request Submitted ⏳',
        message: `Your deposit of ৳${amount} via ${method.toUpperCase()} (TrxID: ${transactionId}) is pending admin approval.`,
        type: 'info',
        link: '/deposit',
      }
    })

    return NextResponse.json({ success: true, deposit })
  } catch (err: any) {
    console.error('Deposit API error:', err)
    return NextResponse.json({ error: 'Failed to submit deposit' }, { status: 500 })
  }
}
