import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import styles from './page.module.css'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'

function platformLogo(name = '') {
  const key = name.toLowerCase()
  if (key.includes('instagram')) return { text: 'IG', bg: 'linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)' }
  if (key.includes('facebook')) return { text: 'f', bg: '#1877f2' }
  if (key.includes('gmail') || key.includes('google')) return { text: 'G', bg: '#ea4335' }
  if (key.includes('tiktok')) return { text: 'TT', bg: '#111827' }
  if (key.includes('netflix')) return { text: 'N', bg: '#e50914' }
  if (key.includes('youtube')) return { text: 'YT', bg: '#ff0000' }
  if (key.includes('telegram')) return { text: 'TG', bg: '#229ed9' }
  return { text: name.slice(0, 2).toUpperCase() || 'PX', bg: 'linear-gradient(135deg,#0ea5e9,#9333ea)' }
}

export default async function Home() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }).catch(() => null) : null

  const [categories, pendingCount, paidCount, homepageBadges] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }).catch(() => []),
    prisma.account.count({ where: { status: 'pending' } }).catch(() => 0),
    prisma.account.count({ where: { status: { in: ['approved', 'sold'] } } }).catch(() => 0),
    getSetting('homepage_badges'),
  ])
  const trustBadges = homepageBadges.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4)

  return (
    <main className={styles.main}>
      <Navbar user={user as any} />

      <section className={styles.hero}>
        <div className={styles.particles} />
        <div className={`container ${styles.heroInner}`}>
          <div className="badge badge-gold fade-in" style={{ animationDelay: '0.1s' }}>
            PremiumX buys verified digital accounts from sellers
          </div>
          <h1 className={styles.title}>
            Sell Your Digital Accounts<br />
            <span className="text-gold">Get Paid After Admin Review</span>
          </h1>
          <p className={styles.subtitle}>
            Submit Instagram, Facebook, Gmail, TikTok and other accounts one by one or by Excel upload.
            Admin reviews the stock, buys valid accounts, and your wallet balance updates.
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
            {categories.map((cat) => {
              const logo = platformLogo(cat.name)
              return (
                <Link href="/sell" key={cat.id} className={styles.categoryCard} style={{ '--hover-color': cat.color } as any}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, background: logo.bg }}>
                    {logo.text}
                  </span>
                  <span className={styles.catName}>{cat.name}</span>
                  <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 800 }}>BDT {cat.defaultPrice}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 32 }}>How Selling Works</h2>
          <div className="grid-3" style={{ gap: 18 }}>
            {[
              { title: '1. Submit Accounts', desc: 'Add username, password, 2FA, or upload an Excel sheet for bulk stock.' },
              { title: '2. Admin Reviews', desc: 'We check account quality, duplicate stock, category, and fixed rate.' },
              { title: '3. Get Wallet Balance', desc: 'Approved stock is bought by admin and seller balance is updated.' },
            ].map((item) => (
              <div key={item.title} className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
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
