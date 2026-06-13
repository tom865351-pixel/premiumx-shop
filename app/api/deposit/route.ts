import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, method, transactionId } = await req.json()
    const numAmount = Number.parseFloat(String(amount))
    const cleanMethod = String(method || '').toLowerCase()
    const cleanTransactionId = String(transactionId || '').trim()

    if (!numAmount || numAmount < 50) {
      return NextResponse.json({ error: 'Minimum add money amount is BDT 50' }, { status: 400 })
    }
    if (!['bkash', 'nagad', 'rocket'].includes(cleanMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    if (cleanTransactionId.length < 4) {
      return NextResponse.json({ error: 'Valid Transaction ID is required' }, { status: 400 })
    }

    const existing = await prisma.topupRequest.findFirst({
      where: { transactionId: cleanTransactionId },
    })
    if (existing) {
      return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 400 })
    }

    const deposit = await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount: numAmount,
        method: cleanMethod,
        transactionId: cleanTransactionId,
        status: 'pending',
      },
    })

    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        title: 'Add Money Request Submitted',
        message: `Your add money request of BDT ${numAmount} via ${cleanMethod.toUpperCase()} (TrxID: ${cleanTransactionId}) is pending admin approval.`,
        type: 'info',
        link: '/wallet',
      },
    })

    return NextResponse.json({ success: true, deposit })
  } catch (err: any) {
    console.error('Deposit API error:', err)
    return NextResponse.json({ error: 'Failed to submit add money request' }, { status: 500 })
  }
}
