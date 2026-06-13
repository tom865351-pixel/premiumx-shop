import type { Metadata } from 'next'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import GlobalBanner from '@/components/layout/GlobalBanner'
import NoticeBoard from '@/components/layout/NoticeBoard'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import LiveToast from '@/components/layout/LiveToast'
import FloatingSupport from '@/components/layout/FloatingSupport'

export const metadata: Metadata = {
  title: 'PremiumX Shop — Buy & Sell Digital Accounts',
  description: 'The most trusted marketplace for buying and selling premium digital accounts. Instagram, Facebook, Gmail, TikTok and more.',
  keywords: 'buy accounts, sell accounts, instagram accounts, facebook accounts, digital marketplace',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PremiumX' },
  themeColor: '#030712',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getAuthUser()
  let themeClass = 'theme-buyer'
  
  if (authUser) {
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (user) {
      themeClass = `theme-${user.role}`
    }
  }

  const authUserData = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId }, select: { username: true, balance: true, role: true } }) : null

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#030712" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={themeClass}>
        <GlobalBanner />
        <NoticeBoard />
        {children}
        <LiveToast />
        <FloatingSupport />
        <MobileBottomNav user={authUserData} />
      </body>
    </html>
  )
}

