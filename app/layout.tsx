import type { Metadata } from 'next'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'PremiumX Shop — Buy & Sell Digital Accounts',
  description: 'The most trusted marketplace for buying and selling premium digital accounts. Instagram, Facebook, Gmail, TikTok and more.',
  keywords: 'buy accounts, sell accounts, instagram accounts, facebook accounts, digital marketplace',
}

import GlobalBanner from '@/components/layout/GlobalBanner'

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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={themeClass}>
        <GlobalBanner />
        {children}
      </body>
    </html>
  )
}
