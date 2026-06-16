import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'users'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      balance: true,
      isVerified: true,
      isBanned: true,
      createdAt: true,
      referralCount: true,
      referralEarnings: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const [statusCounts, recentTransactions, recentListings, totalEarnings] = await Promise.all([
    prisma.account.groupBy({
      by: ['status'],
      where: { sellerId: user.id },
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.account.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        username: true,
        status: true,
        price: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: 'sale', amount: { gt: 0 } },
      _sum: { amount: true },
    }),
  ])

  const byStatus = Object.fromEntries(statusCounts.map((item) => [item.status, {
    count: item._count._all,
    value: item._sum.price || 0,
  }]))

  const approved = byStatus.approved?.count || 0
  const rejected = byStatus.rejected?.count || 0
  const pending = byStatus.pending?.count || 0
  const sold = byStatus.sold?.count || 0
  const decided = approved + rejected + sold
  const approvalRate = decided > 0 ? Math.round(((approved + sold) / decided) * 100) : null

  return NextResponse.json({
    user,
    stats: {
      pending,
      approved,
      rejected,
      sold,
      pendingValue: byStatus.pending?.value || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
      approvalRate,
      qualityLabel: approvalRate === null ? 'New seller' : approvalRate >= 80 ? 'Trusted' : approvalRate >= 50 ? 'Average' : 'Needs review',
    },
    recentTransactions,
    recentListings,
  })
}
