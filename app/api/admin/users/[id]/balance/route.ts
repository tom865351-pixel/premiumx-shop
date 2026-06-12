import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, action } = await req.json()
  const numAmount = parseFloat(amount)

  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (action === 'deduct' && user.balance < numAmount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.id },
    data: {
      balance: action === 'add' ? { increment: numAmount } : { decrement: numAmount }
    }
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'topup', // Reusing topup type for balance additions, could be 'admin_adjustment' if added to schema but topup/refund fits.
      amount: action === 'add' ? numAmount : -numAmount,
      balance: updatedUser.balance,
      description: `Admin Balance Adjustment (${action.toUpperCase()})`
    }
  })

  return NextResponse.json({ success: true, newBalance: updatedUser.balance })
}
