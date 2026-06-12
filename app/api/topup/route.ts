import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const data = await req.json()
    const { amount, paymentMethod, transactionId } = data

    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Minimum topup amount is ৳50' }, { status: 400 })
    }

    if (!paymentMethod || !transactionId) {
      return NextResponse.json({ error: 'Payment method and Transaction ID are required' }, { status: 400 })
    }

    // Check if transaction ID is already used
    const existing = await prisma.topupRequest.findFirst({
      where: { transactionId }
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
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, request })

  } catch (error: any) {
    console.error('Topup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
