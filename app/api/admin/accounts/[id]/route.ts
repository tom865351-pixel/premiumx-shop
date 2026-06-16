import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser || !(await canAccessAdminArea(authUser.role, 'accounts'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await prisma.account.findUnique({ where: { id: params.id } })
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Cannot delete sold accounts that have an order
    if (account.status === 'sold') {
      const order = await prisma.order.findUnique({ where: { accountId: params.id } })
      if (order) {
        return NextResponse.json({ error: 'Cannot delete a sold account that has an order.' }, { status: 400 })
      }
    }

    await prisma.account.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true, message: 'Account deleted successfully.' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
