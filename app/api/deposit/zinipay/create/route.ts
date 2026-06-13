import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()
    const numAmount = Number.parseFloat(String(amount))
    if (!numAmount || numAmount < 50) {
      return NextResponse.json({ error: 'Minimum add money amount is BDT 50' }, { status: 400 })
    }

    const apiKey = process.env.ZINIPAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Payment gateway is not configured. Please use Manual TrxID.' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const txId = `PX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount: numAmount,
        method: 'zinipay',
        transactionId: txId,
        status: 'pending',
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://premiumx-shop.vercel.app'
    const ziniResponse = await fetch('https://api.zinipay.com/v1/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'zini-api-key': apiKey,
      },
      body: JSON.stringify({
        amount: numAmount,
        currency: 'BDT',
        tran_id: txId,
        redirect_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
        success_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
        fail_url: `${baseUrl}/deposit/fail`,
        cancel_url: `${baseUrl}/deposit/fail`,
        cus_name: user.username,
        cus_email: user.email || 'customer@premiumx.shop',
        desc: 'PremiumX Wallet Add Money',
      }),
    })

    const ziniData = await ziniResponse.json()
    const checkoutUrl = ziniData.payment_url || ziniData.url || ziniData.checkout_url
      || ziniData.data?.payment_url || ziniData.data?.url

    if (checkoutUrl) {
      return NextResponse.json({ url: checkoutUrl })
    }

    const errMsg = typeof ziniData.message === 'string' ? ziniData.message : 'Payment gateway error'
    return NextResponse.json({ error: `ZiniPay Error: ${errMsg}` }, { status: 500 })
  } catch (err: any) {
    console.error('ZiniPay Create API error:', err)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
