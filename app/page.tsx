import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import styles from './page.module.css'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function Home() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  
  const recentAccounts = await prisma.account.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { category: true },
  })

  return (
    <main className={styles.main}>
      <Navbar user={user as any} />
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.particles} />
        <div className={`container ${styles.heroInner}`}>
          <div className="badge badge-gold fade-in" style={{ animationDelay: '0.1s' }}>
            ✨ Trusted by 8,200+ Buyers
          </div>
          <h1 className={styles.title}>
            Buy & Sell Premium<br/>
            <span className="text-gold">Digital Accounts</span>
          </h1>
          <p className={styles.subtitle}>
            The most secure marketplace for Instagram, Facebook, TikTok,<br/>
            and gaming accounts. Instant delivery guaranteed.
          </p>
          <div className={styles.actions}>
            <Link href="/browse" className="btn btn-gold btn-lg">Browse Accounts</Link>
            <Link href="/sell" className="btn btn-outline btn-lg">Sell Now</Link>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>12.5K+</div>
              <div className={styles.statLabel}>Accounts Sold</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>99.8%</div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>24/7</div>
              <div className={styles.statLabel}>Admin Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.section}>
        <div className="container">
          <div className="page-header">
            <h2 className="page-title">Top Platforms</h2>
            <Link href="/browse" className="text-gold" style={{ fontSize: 14 }}>View All →</Link>
          </div>
          <div className={styles.categories}>
            {categories.map(cat => (
              <Link href={`/browse?category=${cat.id}`} key={cat.id} className={styles.categoryCard} style={{ '--hover-color': cat.color } as any}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catName}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className={styles.section}>
        <div className="container">
          <h2 className="page-title" style={{ marginBottom: 24 }}>Recent Listings</h2>
          {recentAccounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No accounts available right now</div>
            </div>
          ) : (
            <div className="grid-3">
              {recentAccounts.map(acc => (
                <div key={acc.id} className="card">
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <div className="badge" style={{ background: `${acc.category.color}20`, color: acc.category.color, border: `1px solid ${acc.category.color}40` }}>
                      {acc.category.icon} {acc.category.name}
                    </div>
                    <div className="text-gold font-mono" style={{ fontWeight: 600 }}>৳{acc.price}</div>
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{acc.title}</h3>
                  <div className="flex-col gap-1" style={{ marginBottom: 16 }}>
                    <div className="text-secondary" style={{ fontSize: 13 }}>👥 {acc.followersCount?.toLocaleString()} Followers</div>
                    <div className="text-secondary" style={{ fontSize: 13 }}>📅 Age: {acc.accountAge || 'Unknown'}</div>
                  </div>
                  <Link href={`/account/${acc.id}`} className="btn btn-outline w-full text-center">View Details</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Live Ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <span>🟢 User ***49 just bought Instagram 15K account • 2 min ago</span>
          <span>🟢 User ***12 just bought TikTok 5K account • 5 min ago</span>
          <span>🟢 User ***88 just added ৳500 balance • 12 min ago</span>
          <span>🟢 User ***99 just bought Gmail account • 15 min ago</span>
        </div>
      </div>
    </main>
  )
}
