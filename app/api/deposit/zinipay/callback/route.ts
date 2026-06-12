import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // ZiniPay usually sends payment confirmation data via POST
    // Could be application/json or application/x-www-form-urlencoded
    
    // Parse the incoming webhook payload
    let payload: any;
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const formData = await req.formData()
      payload = Object.fromEntries(formData.entries())
    }

    /*
    EXPECTED PAYLOAD FROM ZINIPAY (Example):
    {
      "status": "COMPLETED",
      "transaction_id": "ZINI-12345678",
      "amount": "500",
      "zinipay_trx_id": "ZP987654321",
      "signature": "hash_to_verify"
    }
    */

    const txId = payload.transaction_id || payload.tx_id || req.nextUrl.searchParams.get('tx_id')
    const status = payload.status || 'COMPLETED' // Usually 'success', 'COMPLETED', etc.

    if (!txId) {
      return NextResponse.json({ error: 'Transaction ID missing' }, { status: 400 })
    }

    // Optional: Verify Signature here using process.env.ZINIPAY_API_KEY to ensure request is genuinely from ZiniPay

    // 1. Find the pending TopupRequest
    const deposit = await prisma.topupRequest.findFirst({
      where: { transactionId: txId }
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit record not found' }, { status: 404 })
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 })
    }

    if (status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'SUCCESS') {
      // 2. Process the auto-deposit!
      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.topupRequest.update({
          where: { id: deposit.id },
          data: { 
            status: 'approved', 
            processedAt: new Date(),
            adminNote: 'Auto-approved via ZiniPay' 
          }
        })

        // Add balance to user
        const updatedUser = await tx.user.update({
          where: { id: deposit.userId },
          data: { balance: { increment: deposit.amount } }
        })

        // Create transaction log
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'topup',
            amount: deposit.amount,
            balance: updatedUser.balance,
            description: `Auto Wallet Top-up via ZiniPay (TrxID: ${txId})`,
            topupId: deposit.id,
          }
        })

        // Notify user
        await tx.notification.create({
          data: {
            userId: deposit.userId,
            title: '✅ Auto Deposit Successful!',
            message: `৳${deposit.amount} has been instantly added to your wallet via ZiniPay.`,
            type: 'success',
            link: '/wallet',
          }
        })
      })

      return NextResponse.json({ message: 'Successfully processed and balance added.' }, { status: 200 })
    } else {
      // Payment Failed or Cancelled
      await prisma.topupRequest.update({
        where: { id: deposit.id },
        data: { status: 'rejected', adminNote: `Payment failed/cancelled. Status: ${status}` }
      })
      return NextResponse.json({ message: 'Marked as failed.' }, { status: 200 })
    }

  } catch (err: any) {
    console.error('ZiniPay Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
