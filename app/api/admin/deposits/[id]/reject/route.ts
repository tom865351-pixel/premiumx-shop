import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'
import { logStaffAction } from '@/lib/staffAudit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'deposits'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deposit = await prisma.topupRequest.findUnique({ where: { id: params.id } })
  if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if (deposit.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  const formData = await req.formData().catch(() => null)
  const note = String(formData?.get('note') || 'Invalid Transaction ID').trim()

  await prisma.topupRequest.update({
    where: { id: params.id },
    data: { status: 'rejected', adminNote: note, processedAt: new Date() },
  })

  await prisma.notification.create({
    data: {
      userId: deposit.userId,
      title: 'Add Money Rejected',
      message: `Your add money request of BDT ${deposit.amount} was rejected. Reason: ${note}.`,
      type: 'danger',
      link: '/wallet',
    },
  })
  await logStaffAction(authUser, 'deposit.reject', 'deposit', deposit.id, { amount: deposit.amount, method: deposit.method, note }, req)

  return NextResponse.redirect(new URL('/admin/deposits', req.url))
}
