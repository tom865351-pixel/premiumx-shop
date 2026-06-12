import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
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
      message: `Your listing "${account.title}" was rejected. Please review and resubmit.`,
      type: 'danger',
      link: '/dashboard',
    },
  })

  return NextResponse.redirect(new URL('/admin/accounts', req.url))
}
