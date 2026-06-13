import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accountIds, action, note } = await req.json()
  const adminNote = String(note || '').trim()

  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return NextResponse.json({ error: 'No accounts selected' }, { status: 400 })
  }

  if (action === 'approve') {
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, status: 'pending' },
    })

    await prisma.$transaction(async (tx) => {
      for (const account of accounts) {
        await tx.account.update({
          where: { id: account.id },
          data: { status: 'approved' },
        })

        const updatedUser = await tx.user.update({
          where: { id: account.sellerId },
          data: { balance: { increment: account.price } },
        })

        await tx.transaction.create({
          data: {
            userId: account.sellerId,
            type: 'sale',
            amount: account.price,
            balance: updatedUser.balance,
            description: `Payment for approved account: ${account.title}${adminNote ? ` (${adminNote})` : ''}`,
          },
        })

        await tx.notification.create({
          data: {
            userId: account.sellerId,
            title: 'Account Approved & Payment Received',
            message: `Your account "${account.title}" has been approved. BDT ${account.price} has been added to your balance.${adminNote ? ` Note: ${adminNote}` : ''}`,
            type: 'success',
            link: '/wallet',
          },
        })
      }
    })

    return NextResponse.json({ success: true, message: `Successfully approved and paid for ${accounts.length} accounts.` })
  }

  if (action === 'reject') {
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, sellerId: true, title: true },
    })

    await prisma.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: { id: { in: accountIds } },
        data: { status: 'rejected' },
      })

      await tx.notification.createMany({
        data: accounts.map((account) => ({
          userId: account.sellerId,
          title: 'Account Rejected',
          message: `Your account "${account.title}" was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
          type: 'warning',
          link: '/orders',
        })),
      })
    })

    return NextResponse.json({ success: true, message: `Successfully rejected ${accounts.length} accounts.` })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
