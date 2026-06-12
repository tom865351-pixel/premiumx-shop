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

    // 1. Create a pending TopupRequest in our database to track this transaction
    // We generate a unique transaction ID for ZiniPay reference
    const txId = 'ZINI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
    
    await prisma.topupRequest.create({
      data: {
        userId: authUser.userId,
        amount: parseFloat(amount),
        method: 'zinipay',
        transactionId: txId,
        status: 'pending',
      }
    })

    // 2. Call ZiniPay API to create a payment session
    const apiKey = process.env.ZINIPAY_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // ZiniPay standard API payload (Adjust if their latest docs require specific field names)
    const ziniPayload = {
      api_key: apiKey,
      amount: amount,
      currency: "BDT",
      tran_id: txId,
      success_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
      fail_url: `${baseUrl}/deposit/fail`,
      cancel_url: `${baseUrl}/deposit/fail`,
      cus_email: authUser.email,
      cus_name: user.username,
      desc: "Wallet Top-up"
    }

    const ziniResponse = await fetch('https://api.zinipay.com/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ziniPayload)
    })

    const ziniData = await ziniResponse.json()
    
    // ZiniPay returns the checkout URL (usually in payment_url, url, or checkout_url)
    const checkoutUrl = ziniData.payment_url || ziniData.url || ziniData.checkout_url
    
    if (checkoutUrl) {
      return NextResponse.json({ url: checkoutUrl })
    } else {
      console.error("ZiniPay Response Error:", ziniData)
      // Fallback: If the API endpoint is different, let the user know they need to check ZiniPay docs
      return NextResponse.json({ error: 'Payment gateway configuration error. Check server logs.' }, { status: 500 })
    }

  } catch (err: any) {
    console.error('ZiniPay Create API error:', err)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
