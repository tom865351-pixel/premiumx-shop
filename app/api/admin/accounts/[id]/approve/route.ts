import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'accounts'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const account = await prisma.account.findUnique({ where: { id: params.id } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    // 1. Mark account as approved
    await tx.account.update({
      where: { id: params.id },
      data: { status: 'approved' },
    })

    // 2. Add balance to seller
    const updatedUser = await tx.user.update({
      where: { id: account.sellerId },
      data: { balance: { increment: account.price } }
    })

    // 3. Create Transaction Log
    await tx.transaction.create({
      data: {
        userId: account.sellerId,
        type: 'sale',
        amount: account.price,
        balance: updatedUser.balance,
        description: `Payment for Approved Account: ${account.title}`,
      }
    })

    // 4. Notify Seller
    await tx.notification.create({
      data: {
        userId: account.sellerId,
        title: 'Account Approved & Payment Received! 💰',
        message: `Your account "${account.title}" has been approved. ৳${account.price} has been added to your balance.`,
        type: 'success',
        link: '/wallet',
      },
    })
  })

  return NextResponse.json({ success: true, message: 'Account approved and seller paid!' })
}
