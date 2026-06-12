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
    // Note: ZiniPay API structure usually looks like this. The user will need to adjust if the API expects different field names.
    const apiKey = process.env.ZINIPAY_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    /* 
    // REAL ZINIPAY API CALL (Uncomment and configure with actual ZiniPay API details)
    
    const ziniResponse = await fetch('https://api.zinipay.com/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        amount: amount,
        transaction_id: txId,
        success_url: `${baseUrl}/deposit/success?tx_id=${txId}`,
        fail_url: `${baseUrl}/deposit/fail`,
        cancel_url: `${baseUrl}/deposit/fail`,
        customer_email: authUser.email,
        customer_name: authUser.username
      })
    })

    const ziniData = await ziniResponse.json()
    
    if (ziniData.status === 'success' && ziniData.payment_url) {
      return NextResponse.json({ url: ziniData.payment_url })
    } else {
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 })
    }
    */

    // MOCK RESPONSE FOR NOW (Until real API key is provided)
    // We will simulate a successful ZiniPay checkout URL creation
    return NextResponse.json({ 
      url: `${baseUrl}/api/deposit/zinipay/mock-checkout?tx_id=${txId}&amount=${amount}` 
    })

  } catch (err: any) {
    console.error('ZiniPay Create API error:', err)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
