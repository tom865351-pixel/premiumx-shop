import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const target = String(formData.get('target') || 'sellers')
  const userId = String(formData.get('userId') || '')
  const title = String(formData.get('title') || '').trim()
  const message = String(formData.get('message') || '').trim()
  const type = String(formData.get('type') || 'info')
  const link = String(formData.get('link') || '').trim() || null

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: target === 'single'
      ? { id: userId }
      : target === 'sellers'
        ? { OR: [{ role: 'seller' }, { listings: { some: {} } }] }
        : {},
    select: { id: true },
  })

  if (users.length === 0) {
    return NextResponse.json({ error: 'No users found for this audience' }, { status: 400 })
  }

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      link,
    })),
  })

  return NextResponse.redirect(new URL('/admin/notifications', req.url))
}
