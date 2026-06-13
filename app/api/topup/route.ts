import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const data = await req.json()
    const amount = Number.parseFloat(String(data.amount || '0'))
    const paymentMethod = String(data.paymentMethod || data.method || '').toLowerCase()
    const transactionId = String(data.transactionId || '').trim()
    const minTopup = Number.parseFloat(await getSetting('min_topup_bdt')) || 50

    if (!amount || amount < minTopup) {
      return NextResponse.json({ error: `Minimum add money amount is BDT ${minTopup}` }, { status: 400 })
    }

    if (!['bkash', 'nagad', 'rocket', 'binance'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    if (transactionId.length < 4) {
      return NextResponse.json({ error: 'Payment method and Transaction ID are required' }, { status: 400 })
    }

    const existing = await prisma.topupRequest.findFirst({
      where: { transactionId },
    })

    if (existing) {
      return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 400 })
    }

    const request = await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount,
        method: paymentMethod,
        transactionId,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, request })
  } catch (error: any) {
    console.error('Topup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
