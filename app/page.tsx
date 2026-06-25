import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import styles from './page.module.css'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import CategoryLogo from '@/components/ui/CategoryLogo'

export default async function Home() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }).catch(() => null) : null

  const [categories, pendingCount, paidCount, homeSettings] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }).catch(() => []),
    prisma.account.count({ where: { status: 'pending' } }).catch(() => 0),
    prisma.account.count({ where: { status: { in: ['approved', 'sold'] } } }).catch(() => 0),
    getSettings(['homepage_badges', 'homepage_hero_badge', 'homepage_hero_title', 'homepage_hero_highlight', 'homepage_hero_subtitle']),
  ])
  const trustBadges = homeSettings.homepage_badges.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4)

  return (
    <main className={styles.main}>
      <Navbar user={user as any} />

      <section className={styles.hero}>
        <div className={styles.particles} />
        <div className={`container ${styles.heroInner}`}>
          <div className="badge badge-gold fade-in" style={{ animationDelay: '0.1s' }}>
            {homeSettings.homepage_hero_badge}
          </div>
          <h1 className={styles.title}>
            {homeSettings.homepage_hero_title}<br />
            <span className="text-gold">{homeSettings.homepage_hero_highlight}</span>
          </h1>
          <p className={styles.subtitle}>
            {homeSettings.homepage_hero_subtitle}
          </p>
          <div className={styles.actions}>
            <Link href="/sell" className="btn btn-gold btn-lg">Start Selling</Link>
            <Link href="/browse" className="btn btn-outline btn-lg">View Rates</Link>
          </div>

          <div className={styles.heroTrust}>
            {trustBadges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending Review</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{paidCount}</div>
              <div className={styles.statLabel}>Accounts Bought</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>Excel</div>
              <div className={styles.statLabel}>Bulk Upload</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className="page-header">
            <div>
              <h2 className="page-title">Accepted Platforms</h2>
              <p className="page-subtitle">Choose a platform, submit credentials, and wait for admin approval.</p>
            </div>
            <Link href="/sell" className="btn btn-gold">Submit Stock</Link>
          </div>
          <div className={styles.categories}>
            {categories.map((cat) => (
              <Link href="/sell" key={cat.id} className={styles.categoryCard} style={{ '--hover-color': cat.color } as any}>
                <CategoryLogo icon={cat.icon} name={cat.name} color={cat.color} size={44} radius={12} />
                <span className={styles.catName}>{cat.name}</span>
                <span style={{ color: 'var(--gold-light)', fontSize: 13, fontWeight: 700 }}>BDT {cat.defaultPrice}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 8 }}>How Selling Works</h2>
          <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Three simple steps from submission to payout.
          </p>
          <div className="grid-3" style={{ gap: 16 }}>
            {[
              { title: 'Submit Accounts', desc: 'Add username, password, 2FA, or upload an Excel sheet for bulk stock.' },
              { title: 'Admin Reviews', desc: 'We check account quality, duplicate stock, category, and fixed rate.' },
              { title: 'Get Wallet Balance', desc: 'Approved stock is bought by admin and seller balance is updated.' },
            ].map((item, i) => (
              <div key={item.title} className="card" style={{ padding: 24 }}>
                <span style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(232, 179, 57, 0.12)',
                  border: '1px solid rgba(232, 179, 57, 0.25)',
                  color: 'var(--gold-light)',
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 16,
                }}>{i + 1}</span>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.toolsPanel}>
            <div>
              <div className="badge badge-blue">Seller control center</div>
              <h2 className={styles.toolsTitle}>Everything sellers need, without noisy popups</h2>
              <p className={styles.toolsText}>
                Submit stock, join live sessions, track review status, and request payout from one clean flow.
              </p>
            </div>
            <div className={styles.toolsGrid}>
              <Link href="/sell" className={styles.toolItem}>
                <span>Submit stock</span>
                <strong>Single or Excel upload</strong>
              </Link>
              <Link href="/wallet" className={styles.toolItem}>
                <span>Wallet</span>
                <strong>Balance, hold, payout</strong>
              </Link>
              <Link href="/live" className={styles.toolItem}>
                <span>Live sessions</span>
                <strong>Class and support links</strong>
              </Link>
              <Link href="/support/new" className={styles.toolItem}>
                <span>Support</span>
                <strong>Open ticket anytime</strong>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
