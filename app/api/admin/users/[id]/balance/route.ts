import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'users'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, action, reason } = await req.json()
  const numAmount = parseFloat(amount)
  const auditReason = String(reason || '').trim()

  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  if (!auditReason) {
    return NextResponse.json({ error: 'Reason is required for wallet audit' }, { status: 400 })
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
      description: `Admin balance adjustment (${action.toUpperCase()}): ${auditReason}`
    }
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Wallet Balance Adjusted',
      message: `Admin ${action === 'add' ? 'added' : 'deducted'} BDT ${numAmount}. Reason: ${auditReason}`,
      type: action === 'add' ? 'success' : 'warning',
      link: '/wallet',
    },
  })

  return NextResponse.json({ success: true, newBalance: updatedUser.balance })
}
