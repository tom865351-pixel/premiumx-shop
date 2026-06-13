import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

const METHODS = ['bkash', 'nagad', 'rocket', 'crypto', 'bank']
const MIN_WITHDRAWAL = 100

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { amount, method, accountNumber } = await req.json()

    if (!amount || !method || !accountNumber) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const numAmount = Number.parseFloat(String(amount))
    if (Number.isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is BDT ${MIN_WITHDRAWAL}` }, { status: 400 })
    }

    const cleanMethod = String(method).toLowerCase()
    if (!METHODS.includes(cleanMethod)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 })
    }

    const cleanAccountNumber = String(accountNumber).trim()
    if (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 80) {
      return NextResponse.json({ error: 'Enter a valid account number or wallet address' }, { status: 400 })
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: user.userId } })
      if (!dbUser) throw new Error('User not found')

      if (dbUser.balance < numAmount) {
        throw new Error('Insufficient balance')
      }

      const created = await tx.withdrawal.create({
        data: {
          userId: user.userId,
          amount: numAmount,
          method: cleanMethod,
          accountNumber: cleanAccountNumber,
          status: 'pending',
        },
      })

      const updatedUser = await tx.user.update({
        where: { id: user.userId },
        data: { balance: { decrement: numAmount } },
      })

      await tx.transaction.create({
        data: {
          userId: user.userId,
          type: 'withdrawal',
          amount: -numAmount,
          balance: updatedUser.balance,
          description: `Withdrawal requested via ${cleanMethod.toUpperCase()} to ${cleanAccountNumber}`,
          withdrawalId: created.id,
        },
      })

      await tx.notification.create({
        data: {
          userId: user.userId,
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal request of BDT ${numAmount} via ${cleanMethod.toUpperCase()} is now pending admin payment.`,
          type: 'info',
          link: '/wallet',
        },
      })

      return created
    })

    return NextResponse.json({ success: true, withdrawalId: withdrawal.id })
  } catch (err: any) {
    const message = err?.message || 'Failed to submit withdrawal'
    const status = message === 'User not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
