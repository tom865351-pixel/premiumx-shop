import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'
import { logStaffAction } from '@/lib/staffAudit'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'accounts'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const reason = String(body.reason || '').trim()
  if (reason.length < 5) {
    return NextResponse.json({ error: 'Reveal reason is required' }, { status: 400 })
  }

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, username: true, sellerId: true, category: { select: { name: true } } },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  await logStaffAction(user, 'account.reveal', 'account', account.id, {
    reason,
    account: account.username,
    title: account.title,
    sellerId: account.sellerId,
    category: account.category?.name,
  }, req)

  return NextResponse.json({ success: true })
}

