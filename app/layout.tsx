import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import GlobalBanner from '@/components/layout/GlobalBanner'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FloatingSupport from '@/components/layout/FloatingSupport'
import InteractionFeedback from '@/components/ui/InteractionFeedback'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import ServiceWorkerRegistrar from '@/components/theme/ServiceWorkerRegistrar'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

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
  const pathname = headers().get('x-pathname') || ''
  const authPathAllowed = ['/login', '/register', '/forgot-password'].some((path) => pathname === path || pathname.startsWith(`${path}/`))

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
    <html lang="en" data-theme="dark">
      <head>
        {/* Apply saved theme before paint to avoid a flash of the wrong theme (FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('premiumx-theme');if(t==='light'||t==='light'){document.documentElement.setAttribute('data-theme','light')}else if(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.setAttribute('data-theme','light')}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${themeClass} ${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          {maintenance.maintenance_mode === 'true' && authUserData?.role !== 'admin' && !authPathAllowed ? (
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
              <InteractionFeedback />
              {children}
              {!authPathAllowed && <FloatingSupport />}
              {!authPathAllowed && <MobileBottomNav user={authUserData} />}
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
