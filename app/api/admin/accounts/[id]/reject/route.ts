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

  await prisma.account.update({
    where: { id: params.id },
    data: { status: 'rejected' },
  })

  await prisma.notification.create({
    data: {
      userId: account.sellerId,
      title: 'Account Listing Rejected ❌',
      message: `Your listing "${account.title}" was rejected by the admin. Please contact support.`,
      type: 'danger',
      link: '/dashboard',
    },
  })

  return NextResponse.json({ success: true, message: 'Account rejected.' })
}
