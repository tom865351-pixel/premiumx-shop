import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import CategoryLogo from '@/components/ui/CategoryLogo'

export default async function Browse() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />

      <main className="container" style={{ padding: '36px 20px 110px', flex: 1 }}>
        <div className="page-header" style={{ alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Sell Rates & Platforms</h1>
            <p className="page-subtitle">These are the account types PremiumX currently buys from users.</p>
          </div>
          <Link href="/sell" className="btn btn-gold">Submit Accounts</Link>
        </div>

        <div className="grid-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CategoryLogo icon={cat.icon} name={cat.name} color={cat.color} size={44} radius={12} />
                <div>
                  <div style={{ fontWeight: 900 }}>{cat.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Fixed buying rate</div>
                </div>
              </div>
              <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 900 }}>BDT {cat.defaultPrice.toLocaleString()}</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, minHeight: 44 }}>
                {cat.description || 'Submit username, password, and 2FA if available. Bulk Excel upload is supported.'}
              </p>
              <Link href="/sell" className="btn btn-outline w-full text-center">Sell {cat.name}</Link>
            </div>
          ))}
        </div>

        <section className="card" style={{ marginTop: 28, padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Seller Price Calculator</h2>
          <div className="grid-4" style={{ marginBottom: 22 }}>
            {categories.slice(0, 4).map((cat) => (
              <div key={cat.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cat.name}</div>
                <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 900 }}>10 pcs = BDT {(cat.defaultPrice * 10).toLocaleString()}</div>
                <div style={{ color: 'var(--success)', fontSize: 12, marginTop: 4 }}>100 pcs = BDT {(cat.defaultPrice * 100).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Bulk Excel Format</h2>
          <div className="grid-3">
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Username</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Account username or email.</p>
            </div>
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Password</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Account login password.</p>
            </div>
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>2FA</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Optional 2FA secret or backup code.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
