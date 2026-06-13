import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import GlobalBanner from '@/components/layout/GlobalBanner'
import NoticeBoard from '@/components/layout/NoticeBoard'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import LiveToast from '@/components/layout/LiveToast'
import FloatingSupport from '@/components/layout/FloatingSupport'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PremiumX Shop - Sell Digital Accounts',
  description: 'Submit Instagram, Facebook, Gmail, TikTok and other digital accounts to PremiumX for admin review and seller payouts.',
  keywords: 'sell accounts, seller payouts, instagram accounts, facebook accounts, digital account submissions',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PremiumX' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#030712',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getAuthUser()
  let themeClass = 'theme-buyer'
  let authUserData = null

  if (authUser) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        select: {
          id: true,
          username: true,
          email: true,
          balance: true,
          role: true,
          preferredCurrency: true,
          preferredLanguage: true,
        },
      })

      if (user) {
        themeClass = `theme-${user.role}`
        authUserData = user
      }
    } catch {
      authUserData = null
    }
  }

  return (
    <html lang="en">
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
