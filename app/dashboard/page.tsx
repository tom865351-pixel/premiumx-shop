import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import styles from './Dashboard.module.css'

function statusClass(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'refunded') return 'warning'
  if (status === 'disputed') return 'danger'
  return 'warning'
}

export default async function Dashboard() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      purchases: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { account: { include: { category: true } } },
      },
      listings: true,
      withdrawals: { where: { status: 'pending' } },
    },
  })

  if (!dbUser) redirect('/login')

  const activeOrders = dbUser.purchases.filter((order) => order.status === 'pending').length
  const totalSpent = dbUser.purchases.reduce((sum, order) => sum + order.amount, 0)
  const activeListings = dbUser.listings.filter((listing) => listing.status === 'approved').length
  const soldListings = dbUser.listings.filter((listing) => listing.status === 'sold').length
  const sellerVolume = dbUser.listings
    .filter((listing) => listing.status === 'sold')
    .reduce((sum, listing) => sum + listing.price, 0)

  return (
    <div className={styles.shell}>
      <Navbar user={dbUser as any} />

      <main className={`container ${styles.main}`}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Account dashboard</div>
            <h1 className={styles.title}>Welcome back, {dbUser.username}</h1>
            <p className={styles.subtitle}>Track balance, purchases, seller stock, and buyer protection from one clean screen.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/browse" className="btn btn-gold">Buy Accounts</Link>
            <Link href="/sell" className="btn btn-outline">Sell Account</Link>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Wallet Balance</div>
              <div className={styles.statIcon} style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}>BDT</div>
            </div>
            <div className={styles.statValue}>BDT {dbUser.balance.toLocaleString()}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Purchases</div>
              <div className={styles.statIcon} style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--primary)' }}>BUY</div>
            </div>
            <div className={styles.statValue}>{dbUser.purchases.length}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Protection Active</div>
              <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>HOLD</div>
            </div>
            <div className={styles.statValue}>{activeOrders}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Total Spent</div>
              <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>OK</div>
            </div>
            <div className={styles.statValue}>BDT {totalSpent.toLocaleString()}</div>
          </div>
        </section>

        <section className={styles.quickActions} aria-label="Quick actions">
          <Link href="/deposit" className={styles.quickAction}>Add Money</Link>
          <Link href="/orders" className={styles.quickAction}>My Orders</Link>
          <Link href="/support/new" className={styles.quickAction}>Open Ticket</Link>
          <Link href="/referral" className={styles.quickAction}>Referral</Link>
        </section>

        {['seller', 'admin', 'sub-admin', 'stock-manager'].includes(dbUser.role) && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Seller Snapshot</h2>
              <Link href="/sell" className="btn btn-sm btn-outline">Add Stock</Link>
            </div>
            <section className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <div className={styles.statLabel}>Active Listings</div>
                  <div className={styles.statIcon} style={{ background: 'rgba(147,51,234,0.12)', color: 'var(--purple)' }}>LIVE</div>
                </div>
                <div className={styles.statValue}>{activeListings}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <div className={styles.statLabel}>Sold Listings</div>
                  <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>SOLD</div>
                </div>
                <div className={styles.statValue}>{soldListings}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <div className={styles.statLabel}>Sales Volume</div>
                  <div className={styles.statIcon} style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}>BDT</div>
                </div>
                <div className={styles.statValue}>BDT {sellerVolume.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <div className={styles.statLabel}>Pending Withdrawals</div>
                  <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>WAIT</div>
                </div>
                <div className={styles.statValue}>{dbUser.withdrawals.length}</div>
              </div>
            </section>
          </>
        )}

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Purchases</h2>
          <Link href="/orders" className="text-gold" style={{ fontSize: 13, fontWeight: 800 }}>View all</Link>
        </div>

        {dbUser.purchases.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No purchases yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Browse verified accounts and your first order will appear here.</p>
            <Link href="/browse" className="btn btn-outline">Start Browsing</Link>
          </div>
        ) : (
          <section className={styles.orders}>
            {dbUser.purchases.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderTitle}>{order.account.title}</div>
                    <div className={styles.orderMeta}>
                      #{order.id.slice(-6).toUpperCase()} · {order.account.category.name} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${statusClass(order.status)}`}>
                    {order.status === 'pending' ? 'Protection active' : order.status}
                  </span>
                </div>
                <div className={styles.orderGrid}>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Price</div>
                    <div className={styles.miniValue}>BDT {order.amount.toLocaleString()}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Protection Ends</div>
                    <div className={styles.miniValue}>{new Date(order.reportWindowEnd).toLocaleDateString()}</div>
                  </div>
                  <Link href="/orders" className={`${styles.miniBox} ${styles.miniValue}`} style={{ textDecoration: 'none', color: 'var(--gold)' }}>
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
