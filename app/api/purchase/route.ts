import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login to purchase.' }, { status: 401 })
    }

    const { accountId } = await req.json()
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { category: true },
      })

      if (!account) throw new Error('Account not found')
      if (account.status !== 'approved') throw new Error('Account is not available for purchase')

      const user = await tx.user.findUnique({ where: { id: authUser.userId } })
      if (!user) throw new Error('User not found')
      if (user.balance < account.price) throw new Error('Insufficient balance')

      const seller = await tx.user.findUnique({ where: { id: account.sellerId } })
      if (!seller) throw new Error('Seller not found')

      const commissionSetting = await tx.siteSetting.findUnique({ where: { key: 'commission_rate' } })
      const commissionRate = Number(commissionSetting?.value || 0)
      const commission = Number((account.price * Math.max(0, commissionRate) / 100).toFixed(2))
      const sellerEarning = Number((account.price - commission).toFixed(2))

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: account.price } },
      })

      await tx.account.update({
        where: { id: account.id },
        data: { status: 'sold' },
      })

      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -account.price,
          type: 'purchase',
          description: `Purchased ${account.title}`,
          balance: user.balance - account.price,
        },
      })

      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          accountId: account.id,
          amount: account.price,
          commission,
          sellerEarning,
          status: 'pending',
          reportWindowEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          deliveredAt: new Date(),
        },
      })

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Purchase Successful',
          message: `You successfully purchased ${account.title} for BDT ${account.price}. Please check it within the protection window.`,
          type: 'success',
        },
      })

      await tx.notification.create({
        data: {
          userId: seller.id,
          title: 'Account Sold',
          message: `Your account ${account.title} was sold for BDT ${account.price}. Your payout is BDT ${sellerEarning} after commission and will be released after the protection window.`,
          type: 'info',
        },
      })

      const remainingStock = await tx.account.count({
        where: { categoryId: account.category.id, status: 'approved' },
      })

      if (remainingStock < account.category.lowStockAlert) {
        const admins = await tx.user.findMany({ where: { role: 'admin' } })
        await Promise.all(admins.map((admin) =>
          tx.notification.create({
            data: {
              userId: admin.id,
              title: `Low Stock Alert: ${account.category.name}`,
              message: `Only ${remainingStock} accounts left in ${account.category.name}. Please restock.`,
              type: 'warning',
              link: '/admin/accounts',
            },
          })
        ))
      }

      return order
    })

    return NextResponse.json({ success: true, message: 'Purchase successful' })
  } catch (error: any) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 400 })
  }
}
