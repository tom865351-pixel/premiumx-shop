import { NextRequest, NextResponse } from 'next/server'
import { appUrl, signInOAuthUser } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!code || !clientId || !clientSecret) return NextResponse.redirect(new URL('/login?error=Google login failed', req.url))

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl(req.url)}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const token = await tokenRes.json()
  if (!token.access_token) return NextResponse.redirect(new URL('/login?error=Google login failed', req.url))

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
  const profile = await profileRes.json()
  if (!profile.email) return NextResponse.redirect(new URL('/login?error=Google email not found', req.url))

  return signInOAuthUser({ email: profile.email, name: profile.name, avatar: profile.picture }, appUrl(req.url))
}
