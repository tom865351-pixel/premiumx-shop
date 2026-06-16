import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'users'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.user.update({
    where: { id: params.id },
    data: { isBanned: !target.isBanned },
  })

  return NextResponse.redirect(new URL('/admin/users', req.url))
}
