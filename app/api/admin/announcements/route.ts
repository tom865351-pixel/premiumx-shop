import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user || (user.role !== 'admin' && user.role !== 'sub-admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, message, type, target, link } = await req.json()
  
  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      message,
      type: type || 'info',
      target: target || 'all',
      link: link || null,
      isActive: true
    }
  })

  return NextResponse.json(announcement)
}
