import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID
  if (!appId) return NextResponse.redirect(new URL('/login?error=Facebook login is not configured yet', req.url))

  const redirectUri = `${appUrl(req.url)}/api/auth/facebook/callback`
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'email,public_profile')
  return NextResponse.redirect(url)
}

