import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user || (user.role !== 'admin' && user.role !== 'sub-admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, message, type, target, link, scheduledAt, expiresAt } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: String(title).trim(),
      message: String(message).trim(),
      type: type || 'info',
      target: target || 'all',
      link: link ? String(link).trim() : null,
      scheduledAt: parseDate(scheduledAt),
      expiresAt: parseDate(expiresAt),
      isActive: true,
    },
  })

  return NextResponse.json(announcement)
}
