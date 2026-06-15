import { NextRequest, NextResponse } from 'next/server'
import { appUrl, signInOAuthUser } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET
  if (!code || !appId || !appSecret) return NextResponse.redirect(new URL('/login?error=Facebook login failed', req.url))

  const redirectUri = `${appUrl(req.url)}/api/auth/facebook/callback`
  const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', code)
  const tokenRes = await fetch(tokenUrl)
  const token = await tokenRes.json()
  if (!token.access_token) return NextResponse.redirect(new URL('/login?error=Facebook login failed', req.url))

  const profileUrl = new URL('https://graph.facebook.com/me')
  profileUrl.searchParams.set('fields', 'id,name,email,picture')
  profileUrl.searchParams.set('access_token', token.access_token)
  const profileRes = await fetch(profileUrl)
  const profile = await profileRes.json()
  if (!profile.email) return NextResponse.redirect(new URL('/login?error=Facebook email permission is required', req.url))

  return signInOAuthUser({ email: profile.email, name: profile.name, avatar: profile.picture?.data?.url }, appUrl(req.url))
}
