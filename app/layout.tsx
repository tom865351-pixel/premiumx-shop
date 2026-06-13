import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import GlobalBanner from '@/components/layout/GlobalBanner'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FloatingSupport from '@/components/layout/FloatingSupport'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PremiumX Shop - Sell Digital Accounts',
  description: 'Submit Instagram, Facebook, Gmail, TikTok and other digital accounts to PremiumX for admin review and seller payouts.',
  keywords: 'sell accounts, seller payouts, instagram accounts, facebook accounts, digital account submissions',
  manifest: '/manifest.webmanifest',
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
  const maintenance = await getSettings(['maintenance_mode', 'maintenance_message'])

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
        {maintenance.maintenance_mode === 'true' && authUserData?.role !== 'admin' ? (
          <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
            <div className="card" style={{ maxWidth: 520, padding: 32, textAlign: 'center' }}>
              <div className="badge badge-warning" style={{ marginBottom: 16 }}>Maintenance Mode</div>
              <h1 style={{ fontSize: 30, marginBottom: 12 }}>PremiumX is updating</h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {maintenance.maintenance_message || 'PremiumX is being updated. Please check again soon.'}
              </p>
            </div>
          </main>
        ) : (
          <>
            <GlobalBanner />
            {children}
            <FloatingSupport />
            <MobileBottomNav user={authUserData} />
          </>
        )}
      </body>
    </html>
  )
}
