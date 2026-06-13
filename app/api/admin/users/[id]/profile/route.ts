import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, username, phone, isVerified, banReason } = await req.json()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanUsername = String(username || '').trim()
  const cleanPhone = String(phone || '').trim()

  if (!cleanEmail || !cleanUsername) {
    return NextResponse.json({ error: 'Email and username are required' }, { status: 400 })
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: params.id },
      OR: [
        { email: cleanEmail },
        { username: cleanUsername },
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ],
    },
    select: { email: true, username: true, phone: true },
  })

  if (duplicate) {
    if (duplicate.email === cleanEmail) return NextResponse.json({ error: 'Email already used by another user' }, { status: 400 })
    if (duplicate.username === cleanUsername) return NextResponse.json({ error: 'Username already used by another user' }, { status: 400 })
    return NextResponse.json({ error: 'Phone already used by another user' }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.id },
    data: {
      email: cleanEmail,
      username: cleanUsername,
      phone: cleanPhone || null,
      isVerified: Boolean(isVerified),
      banReason: banReason ? String(banReason).trim() : null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      phone: true,
      isVerified: true,
      banReason: true,
    },
  })

  return NextResponse.json({ success: true, user: updatedUser })
}
