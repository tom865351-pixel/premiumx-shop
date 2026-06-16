import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser, hashPassword } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'users'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password } = await req.json()
  const newPassword = String(password || '')

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { password: await hashPassword(newPassword) },
  })

  return NextResponse.json({ success: true })
}
