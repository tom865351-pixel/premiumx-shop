import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()
    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Minimum deposit is ৳50' }, { status: 400 })
    }

    // Fetch full user from DB to get the username
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 1. Create a pending TopupRequest in our database
    const txId = 'PX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()

    await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount: parseFloat(amount),
        method: 'zinipay',
        transactionId: txId,
        status: 'pending',
      }
    })

    // 2. Call ZiniPay official API (from zinipay.com/docs)
    const apiKey = process.env.ZINIPAY_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const ziniResponse = await fetch('https://api.zinipay.com/v1/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'zini-api-key': apiKey || '',
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: 'BDT',
        tran_id: txId,
        redirect_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
        success_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
        fail_url: `${baseUrl}/deposit/fail`,
        cancel_url: `${baseUrl}/deposit/fail`,
        cus_name: user.username,
        cus_email: user.email || 'customer@premiumx.shop',
        desc: 'PremiumX Wallet Top-up',
      })
    })

    const ziniData = await ziniResponse.json()
    console.log('ZiniPay Full Response:', JSON.stringify(ziniData))

    // ZiniPay returns payment_url or url in response
    const checkoutUrl = ziniData.payment_url || ziniData.url || ziniData.checkout_url 
      || ziniData.data?.payment_url || ziniData.data?.url

    if (checkoutUrl) {
      return NextResponse.json({ url: checkoutUrl })
    } else {
      // Return full response for debugging
      const errMsg = typeof ziniData.message === 'string' 
        ? ziniData.message 
        : JSON.stringify(ziniData)
      return NextResponse.json({ error: 'ZiniPay Error: ' + errMsg, raw: ziniData }, { status: 500 })
    }

  } catch (err: any) {
    console.error('ZiniPay Create API error:', err)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
