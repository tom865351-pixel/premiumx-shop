import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import styles from './Dashboard.module.css'

function statusClass(status: string) {
  if (status === 'approved' || status === 'sold' || status === 'bought') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

function submissionGroups(listings: any[]) {
  const map = new Map<string, { category: string; status: string; count: number; total: number; latest: Date }>()
  for (const listing of listings) {
    const status = listing.status === 'approved' ? 'Bought' : listing.status
    const key = `${listing.category.name}-${status}`
    const current = map.get(key)
    if (current) {
      current.count += 1
      current.total += listing.price
      if (listing.createdAt > current.latest) current.latest = listing.createdAt
    } else {
      map.set(key, {
        category: listing.category.name,
        status,
        count: 1,
        total: listing.price,
        latest: listing.createdAt,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.latest.getTime() - a.latest.getTime())
}

export default async function Dashboard() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      listings: {
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      },
      withdrawals: { where: { status: 'pending' } },
    },
  })

  if (!dbUser) redirect('/login')

  const pendingSubmissions = dbUser.listings.filter((listing) => listing.status === 'pending').length
  const boughtByAdmin = dbUser.listings.filter((listing) => listing.status === 'approved' || listing.status === 'sold').length
  const rejectedSubmissions = dbUser.listings.filter((listing) => listing.status === 'rejected').length
  const expectedPayout = dbUser.listings
    .filter((listing) => listing.status === 'pending')
    .reduce((sum, listing) => sum + listing.price, 0)
  const paidVolume = dbUser.listings
    .filter((listing) => listing.status === 'approved' || listing.status === 'sold')
    .reduce((sum, listing) => sum + listing.price, 0)
  const groups = submissionGroups(dbUser.listings).slice(0, 8)

  return (
    <div className={styles.shell}>
      <Navbar user={dbUser as any} />

      <main className={`container ${styles.main}`}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Seller dashboard</div>
            <h1 className={styles.title}>Welcome back, {dbUser.username}</h1>
            <p className={styles.subtitle}>Submit accounts, track admin review, and manage your seller wallet from one screen.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/sell" className="btn btn-gold">Submit Accounts</Link>
            <Link href="/browse" className="btn btn-outline">View Rates</Link>
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
              <div className={styles.statLabel}>Pending Review</div>
              <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>WAIT</div>
            </div>
            <div className={styles.statValue}>{pendingSubmissions}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Bought by Admin</div>
              <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>OK</div>
            </div>
            <div className={styles.statValue}>{boughtByAdmin}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Pending Value</div>
              <div className={styles.statIcon} style={{ background: 'rgba(147,51,234,0.12)', color: 'var(--purple)' }}>BDT</div>
            </div>
            <div className={styles.statValue}>BDT {expectedPayout.toLocaleString()}</div>
          </div>
        </section>

        <section className={styles.quickActions} aria-label="Quick actions">
          <Link href="/sell" className={styles.quickAction}>Submit Stock</Link>
          <Link href="/browse" className={styles.quickAction}>Rates</Link>
          <Link href="/wallet" className={styles.quickAction}>Wallet</Link>
          <Link href="/live" className={styles.quickAction}>Live Sessions</Link>
        </section>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Paid Stock Value</div>
              <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>PAID</div>
            </div>
            <div className={styles.statValue}>BDT {paidVolume.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Rejected</div>
              <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}>NO</div>
            </div>
            <div className={styles.statValue}>{rejectedSubmissions}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Pending Withdrawals</div>
              <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>WAIT</div>
            </div>
            <div className={styles.statValue}>{dbUser.withdrawals.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Total Submitted</div>
              <div className={styles.statIcon} style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--primary)' }}>ALL</div>
            </div>
            <div className={styles.statValue}>{dbUser.listings.length}</div>
          </div>
        </section>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Submissions</h2>
          <Link href="/sell" className="text-gold" style={{ fontSize: 13, fontWeight: 800 }}>Add more</Link>
        </div>

        {dbUser.listings.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No submissions yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Submit your first account or upload an Excel sheet.</p>
            <Link href="/sell" className="btn btn-outline">Submit Account</Link>
          </div>
        ) : (
          <section className={styles.orders}>
            {groups.map((group) => (
              <article key={`${group.category}-${group.status}`} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderTitle}>{group.category}</div>
                    <div className={styles.orderMeta}>
                      Latest submitted: {group.latest.toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${statusClass(group.status.toLowerCase())}`}>
                    {group.status}
                  </span>
                </div>
                <div className={styles.orderGrid}>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Submitted Pieces</div>
                    <div className={styles.miniValue}>{group.count} pcs</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Total Rate</div>
                    <div className={styles.miniValue}>BDT {group.total.toLocaleString()}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Admin Status</div>
                    <div className={styles.miniValue}>{group.status === 'pending' ? 'Waiting review' : group.status}</div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

