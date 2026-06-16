import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'
import { releaseSellerPayout } from '@/lib/orders'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'orders'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.$transaction((tx) => releaseSellerPayout(tx, params.id))
    return NextResponse.redirect(new URL('/admin/orders', req.url))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payout release failed' }, { status: 400 })
  }
}
