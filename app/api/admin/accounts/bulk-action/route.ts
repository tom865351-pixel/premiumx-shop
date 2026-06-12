import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accountIds, action } = await req.json()

  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return NextResponse.json({ error: 'No accounts selected' }, { status: 400 })
  }

  if (action === 'approve') {
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, status: 'pending' }
    })

    await prisma.$transaction(async (tx) => {
      for (const account of accounts) {
        // 1. Mark account as approved
        await tx.account.update({
          where: { id: account.id },
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
      }
    })

    return NextResponse.json({ success: true, message: `Successfully approved and paid for ${accounts.length} accounts.` })
  } 
  
  if (action === 'reject') {
    await prisma.account.updateMany({
      where: { id: { in: accountIds } },
      data: { status: 'rejected' }
    })
    return NextResponse.json({ success: true, message: `Successfully rejected ${accountIds.length} accounts.` })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
