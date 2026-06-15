import prisma from './prisma'
import { hashPassword, signToken } from './auth'
import { NextResponse } from 'next/server'

export function appUrl(reqUrl: string) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(reqUrl).origin
}

export async function uniqueUsername(seed: string) {
  const base = seed.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 18) || 'user'
  for (let i = 0; i < 20; i += 1) {
    const username = i === 0 ? base : `${base}_${i}`
    const existing = await prisma.user.findUnique({ where: { username } })
    if (!existing) return username
  }
  return `${base}_${Date.now().toString(36)}`
}

export async function signInOAuthUser(profile: { email: string; name?: string; avatar?: string | null }, baseUrl: string) {
  const email = profile.email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  const user = existing || await prisma.user.create({
    data: {
      email,
      username: await uniqueUsername(profile.name || email.split('@')[0]),
      password: await hashPassword(`oauth-${crypto.randomUUID()}`),
      role: 'buyer',
      avatar: profile.avatar || null,
      isVerified: true,
    },
  })

  const token = await signToken({ userId: user.id, email: user.email, role: user.role })
  const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
  response.cookies.set({
    name: 'px_token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  })
  return response
}
