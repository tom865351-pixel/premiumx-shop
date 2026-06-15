import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return NextResponse.redirect(new URL('/login?error=Google login is not configured yet', req.url))

  const redirectUri = `${appUrl(req.url)}/api/auth/google/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('prompt', 'select_account')
  return NextResponse.redirect(url)
}

