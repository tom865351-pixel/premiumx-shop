import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const SUCCESS_STATUSES = new Set(['COMPLETED', 'SUCCESS', 'PAID', 'VALID', 'APPROVED'])
const FAILED_STATUSES = new Set(['FAILED', 'CANCELLED', 'CANCELED', 'REJECTED', 'EXPIRED'])

async function processZiniPayment(txId: string, status: string, providerRef?: string) {
  const normalizedStatus = status.toUpperCase()
  const deposit = await prisma.topupRequest.findFirst({
    where: { transactionId: txId },
  })

  if (!deposit) {
    return { ok: false, status: 404, message: 'Deposit record not found' }
  }

  if (deposit.status !== 'pending') {
    return { ok: true, status: 200, message: 'Transaction already processed', finalStatus: deposit.status }
  }

  if (FAILED_STATUSES.has(normalizedStatus)) {
    await prisma.topupRequest.update({
      where: { id: deposit.id },
      data: {
        status: 'rejected',
        adminNote: `ZiniPay payment failed or cancelled. Status: ${normalizedStatus}`,
        processedAt: new Date(),
      },
    })
    return { ok: true, status: 200, message: 'Payment marked failed', finalStatus: 'rejected' }
  }

  if (!SUCCESS_STATUSES.has(normalizedStatus)) {
    return { ok: false, status: 400, message: `Unsupported ZiniPay status: ${normalizedStatus}` }
  }

  await prisma.$transaction(async (tx) => {
    await tx.topupRequest.update({
      where: { id: deposit.id },
      data: {
        status: 'approved',
        processedAt: new Date(),
        adminNote: providerRef ? `Auto-approved via ZiniPay (${providerRef})` : 'Auto-approved via ZiniPay',
      },
    })

    const updatedUser = await tx.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    })

    await tx.transaction.create({
      data: {
        userId: deposit.userId,
        type: 'topup',
        amount: deposit.amount,
        balance: updatedUser.balance,
        description: `Auto wallet add money via ZiniPay (TrxID: ${txId})`,
        topupId: deposit.id,
      },
    })

    await tx.notification.create({
      data: {
        userId: deposit.userId,
        title: 'Auto Payment Successful',
        message: `BDT ${deposit.amount} has been added to your wallet via ZiniPay.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })

  return { ok: true, status: 200, message: 'Successfully processed and balance added', finalStatus: 'approved' }
}

function redirectResult(req: NextRequest, result: { finalStatus?: string }, txId: string) {
  const success = result.finalStatus === 'approved'
  const path = success ? '/deposit/success' : '/deposit/fail'
  return NextResponse.redirect(new URL(`${path}?tx_id=${encodeURIComponent(txId)}`, req.url), 303)
}

export async function GET(req: NextRequest) {
  const txId = req.nextUrl.searchParams.get('tx_id') || req.nextUrl.searchParams.get('tran_id') || ''
  const status = req.nextUrl.searchParams.get('status') || req.nextUrl.searchParams.get('payment_status') || 'SUCCESS'
  const providerRef = req.nextUrl.searchParams.get('provider_ref') || req.nextUrl.searchParams.get('zinipay_trx_id') || undefined
  const shouldRedirect = req.nextUrl.searchParams.get('return') === '1'

  if (!txId) {
    return shouldRedirect
      ? NextResponse.redirect(new URL('/deposit/fail', req.url), 303)
      : NextResponse.json({ error: 'Transaction ID missing' }, { status: 400 })
  }

  const result = await processZiniPayment(txId, status, providerRef)
  if (shouldRedirect) return redirectResult(req, result, txId)
  return NextResponse.json(result, { status: result.status })
}

export async function POST(req: NextRequest) {
  try {
    let payload: any
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const formData = await req.formData()
      payload = Object.fromEntries(formData.entries())
    }

    const txId = payload.transaction_id || payload.tx_id || payload.tran_id || req.nextUrl.searchParams.get('tx_id')
    const status = payload.status || payload.payment_status || req.nextUrl.searchParams.get('status') || 'SUCCESS'
    const providerRef = payload.zinipay_trx_id || payload.provider_ref || payload.payment_id

    if (!txId) {
      return NextResponse.json({ error: 'Transaction ID missing' }, { status: 400 })
    }

    const result = await processZiniPayment(String(txId), String(status), providerRef ? String(providerRef) : undefined)
    return NextResponse.json(result, { status: result.status })
  } catch (err: any) {
    console.error('ZiniPay callback error:', err)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
