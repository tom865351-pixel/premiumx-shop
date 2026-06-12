import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, display: 'flex', gap: 32 }}>
        <aside style={{ width: 240, flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Settings</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/settings" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>👤 General Profile</Link>
            <Link href="/settings/security" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>🛡️ Security & Login History</Link>
          </nav>
        </aside>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
