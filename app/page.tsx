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

  const reviewStats = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { id: true }
  })
  
  const avgRating = reviewStats._avg.rating ? reviewStats._avg.rating.toFixed(1) : '5.0'
  const totalReviews = reviewStats._count.id

  // Real recent orders for activity ticker
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      account: { include: { category: true } },
      buyer: { select: { username: true } }
    }
  })

  const tickerItems = recentOrders.length > 0
    ? recentOrders.map(o => {
        const maskedUser = o.buyer.username.slice(0, 3) + '***'
        const mins = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000))
        return `🟢 ${maskedUser} just bought ${o.account.category.icon} ${o.account.category.name} account • ${mins < 60 ? mins + ' min ago' : Math.round(mins/60) + 'h ago'}`
      })
    : [
        '🟢 User ***49 just bought Instagram 15K account • 2 min ago',
        '🟢 User ***12 just bought TikTok 5K account • 5 min ago',
        '🟢 User ***88 just added ৳500 balance • 12 min ago',
        '🟢 User ***99 just bought Gmail account • 15 min ago',
      ]

  return (
    <main className={styles.main}>
      <Navbar user={user as any} />
      
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Animated blue glow orbs */}
        <div className={styles.glow1} />
        <div className={styles.glow2} />
        <div className={styles.particles} />
        <div className={`container ${styles.heroInner}`}>
          <div className="badge badge-gold fade-in" style={{ animationDelay: '0.1s' }}>
            ✨ {totalReviews > 0 ? `Trusted by ${totalReviews}+ Buyers (⭐ ${avgRating}/5)` : '✨ Trusted by 8,200+ Buyers'}
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
            <Link href="/browse" className="btn btn-gold btn-lg">🛒 Buy Accounts</Link>
            <Link href="/sell" className="btn btn-outline btn-lg">📤 Sell Now</Link>
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
                <div 
                  key={acc.id} 
                  className="card" 
                  style={{ 
                    transition: 'all 0.3s ease', 
                    border: '1px solid rgba(14, 165, 233, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    ':hover': { 
                      transform: 'translateY(-6px)',
                      border: '1px solid rgba(14, 165, 233, 0.5)',
                      boxShadow: '0 8px 30px rgba(14, 165, 233, 0.15)',
                    } 
                  } as any}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} className="card-glow" />

                  <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                      <div className="badge" style={{ 
                        background: `${acc.category.color}15`, 
                        color: acc.category.color, 
                        border: `1px solid ${acc.category.color}40`,
                        backdropFilter: 'blur(10px)',
                        fontWeight: 600
                      }}>
                        {acc.category.icon} {acc.category.name}
                      </div>
                      <div className="text-gold font-mono" style={{ fontWeight: 800, fontSize: 18, textShadow: '0 0 10px rgba(234, 179, 8, 0.2)' }}>৳{acc.price}</div>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: 17, 
                      marginBottom: 12, 
                      fontWeight: 700,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{acc.title}</h3>
                    
                    <div className="flex-col gap-2" style={{ marginBottom: 20, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>👥 {acc.followersCount?.toLocaleString() || 'N/A'} Followers</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>📅 Age: {acc.accountAge || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/account/${acc.id}`} 
                      className="btn w-full text-center" 
                      style={{ 
                        background: 'linear-gradient(to right, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.2))',
                        border: '1px solid rgba(14, 165, 233, 0.3)',
                        color: '#38bdf8',
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/browse" className="btn btn-blue btn-lg">Browse All Accounts →</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.section} style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 className="page-title" style={{ textAlign: 'center', marginBottom: 40 }}>Why Choose PremiumX?</h2>
          <div className="grid-3" style={{ gap: 24 }}>
            {[
              { icon: '🛡️', title: 'Verified Accounts', desc: 'Every account is manually reviewed by admins before going live on the marketplace.' },
              { icon: '⚡', title: 'Instant Delivery', desc: 'Once payment is confirmed, you get full access credentials immediately.' },
              { icon: '💳', title: 'Easy Top-Up', desc: 'Add balance via bKash, Nagad, or Rocket in seconds. Instant wallet credit.' },
              { icon: '🔒', title: '100% Secure', desc: 'Your data is encrypted. Buyer and seller identities are protected at all times.' },
              { icon: '🎫', title: '24/7 Support', desc: 'Open a support ticket anytime. Our team responds within hours.' },
              { icon: '💰', title: 'Seller Payouts', desc: 'Sell your accounts and get paid instantly upon admin approval.' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Live Ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerLabel}>🔴 LIVE</div>
        <div className={styles.tickerTrack}>
          {tickerItems.join('   •   ')}
          &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
          {tickerItems.join('   •   ')}
        </div>
      </div>
    </main>
  )
}

