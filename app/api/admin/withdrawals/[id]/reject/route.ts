import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function readFormValue(req: NextRequest, key: string) {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('form')) return ''
  const formData = await req.formData()
  return String(formData.get(key) || '').trim()
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const note = await readFormValue(req, 'adminNote')
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } })
  if (!withdrawal || withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    const reserveTx = await tx.transaction.findUnique({
      where: { withdrawalId: withdrawal.id },
    })

    await tx.withdrawal.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        adminNote: note || withdrawal.adminNote,
        processedAt: new Date(),
      },
    })

    if (reserveTx) {
      const updatedUser = await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      })

      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'refund',
          amount: withdrawal.amount,
          balance: updatedUser.balance,
          description: `Withdrawal rejected - BDT ${withdrawal.amount} returned to wallet${note ? ` (${note})` : ''}`,
        },
      })
    }

    await tx.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of BDT ${withdrawal.amount} was rejected. The amount has been returned to your wallet${note ? `. Reason: ${note}` : '.'}`,
        type: 'warning',
        link: '/wallet',
      },
    })
  })

  return NextResponse.redirect(new URL('/admin/withdrawals', req.url))
}
