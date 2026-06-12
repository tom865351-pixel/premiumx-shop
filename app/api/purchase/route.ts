import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login to purchase.' }, { status: 401 })
    }

    const data = await req.json()
    const { accountId } = data

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Process purchase in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch account and user with lock
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { category: true }
      })

      if (!account) throw new Error('Account not found')
      if (account.status !== 'approved') throw new Error('Account is not available for purchase')

      const user = await tx.user.findUnique({
        where: { id: authUser.userId }
      })

      if (!user) throw new Error('User not found')
      if (user.balance < account.price) throw new Error('Insufficient balance')

      const seller = await tx.user.findUnique({
        where: { id: account.sellerId }
      })

      if (!seller) throw new Error('Seller not found')

      // 2. Deduct balance from buyer
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: account.price } }
      })

      // 3. Add balance to seller (minus platform fee? For now 100%)
      await tx.user.update({
        where: { id: seller.id },
        data: { balance: { increment: account.price } }
      })

      // 4. Mark account as sold
      await tx.account.update({
        where: { id: account.id },
        data: { status: 'sold' }
      })

      // 5. Create transaction records
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -account.price,
          type: 'purchase',
          description: `Purchased ${account.title}`
        }
      })

      await tx.transaction.create({
        data: {
          userId: seller.id,
          amount: account.price,
          type: 'sale',
          description: `Sold ${account.title}`
        }
      })

      // 6. Create Purchase record linking buyer and account
      const purchase = await tx.purchase.create({
        data: {
          buyerId: user.id,
          accountId: account.id,
          amount: account.price,
        }
      })

      // 7. Send notifications
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Purchase Successful',
          message: `You successfully purchased ${account.title} for ৳${account.price}`,
          type: 'purchase'
        }
      })

      await tx.notification.create({
        data: {
          userId: seller.id,
          title: 'Account Sold',
          message: `Your account ${account.title} was sold for ৳${account.price}`,
          type: 'sale'
        }
      })

      return purchase
    })

    return NextResponse.json({ success: true, message: 'Purchase successful' })

  } catch (error: any) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 400 })
  }
}
