import type { Prisma } from '@prisma/client'

export async function releaseSellerPayout(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      account: {
        select: {
          title: true,
          sellerId: true,
        },
      },
    },
  })

  if (!order) throw new Error('Order not found')
  if (order.status === 'completed') return order
  if (order.status === 'refunded') throw new Error('Refunded orders cannot be released')
  if (order.status === 'disputed') throw new Error('Disputed orders cannot be released')

  const updatedSeller = await tx.user.update({
    where: { id: order.account.sellerId },
    data: { balance: { increment: order.sellerEarning } },
  })

  await tx.transaction.create({
    data: {
      userId: order.account.sellerId,
      amount: order.sellerEarning,
      type: 'sale',
      description: `Payout released for ${order.account.title}`,
      balance: updatedSeller.balance,
      orderId: order.id,
    },
  })

  const updatedOrder = await tx.order.update({
    where: { id: order.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  })

  await tx.notification.create({
    data: {
      userId: order.account.sellerId,
      title: 'Payout Released',
      message: `BDT ${order.sellerEarning} has been added to your balance for ${order.account.title}.`,
      type: 'success',
      link: '/wallet',
    },
  })

  return updatedOrder
}
