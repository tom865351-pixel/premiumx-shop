import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import styles from '@/app/dashboard/Dashboard.module.css'

function statusClass(status: string) {
  if (status === 'approved' || status === 'sold' || status === 'bought') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

function reviewTimer(createdAt: Date) {
  const due = new Date(createdAt)
  due.setHours(due.getHours() + 24)
  const diff = due.getTime() - Date.now()
  if (diff <= 0) return 'Review due now'
  const hours = Math.ceil(diff / (1000 * 60 * 60))
  return `${hours}h review target left`
}

function submissionGroups(listings: any[]) {
  const map = new Map<string, { category: string; status: string; count: number; total: number; latest: Date; oldestPending?: Date }>()
  for (const listing of listings) {
    const status = listing.status === 'approved' ? 'Bought' : listing.status
    const key = `${listing.category.name}-${status}`
    const current = map.get(key)
    if (current) {
      current.count += 1
      current.total += listing.price
      if (listing.createdAt > current.latest) current.latest = listing.createdAt
      if (listing.status === 'pending' && (!current.oldestPending || listing.createdAt < current.oldestPending)) current.oldestPending = listing.createdAt
    } else {
      map.set(key, {
        category: listing.category.name,
        status,
        count: 1,
        total: listing.price,
        latest: listing.createdAt,
        oldestPending: listing.status === 'pending' ? listing.createdAt : undefined,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.latest.getTime() - a.latest.getTime())
}

export default async function OrdersPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      listings: {
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      },
    },
  })

  if (!user) redirect('/login')

  const pending = user.listings.filter((listing) => listing.status === 'pending').length
  const bought = user.listings.filter((listing) => listing.status === 'approved' || listing.status === 'sold').length
  const rejected = user.listings.filter((listing) => listing.status === 'rejected').length
  const totalValue = user.listings.reduce((sum, listing) => sum + listing.price, 0)
  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)
  const submitted7 = user.listings.filter((listing) => listing.createdAt >= since7).length
  const earnedValue = user.listings
    .filter((listing) => listing.status === 'approved' || listing.status === 'sold')
    .reduce((sum, listing) => sum + listing.price, 0)
  const groups = submissionGroups(user.listings)

  return (
    <div className={styles.shell}>
      <Navbar user={user as any} />

      <main className={`container ${styles.main}`} style={{ maxWidth: 1040 }}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Seller submissions</div>
            <h1 className={styles.title}>My Submissions</h1>
            <p className={styles.subtitle}>Track every account you submitted to PremiumX for admin review and payout.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/sell" className="btn btn-gold">Submit More</Link>
            <Link href="/browse" className="btn btn-outline">View Rates</Link>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>All Submitted</div>
              <div className={styles.statIcon} style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--primary)' }}>ALL</div>
            </div>
            <div className={styles.statValue}>{user.listings.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Pending</div>
              <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>WAIT</div>
            </div>
            <div className={styles.statValue}>{pending}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Bought</div>
              <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>OK</div>
            </div>
            <div className={styles.statValue}>{bought}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>Total Stock Value</div>
              <div className={styles.statIcon} style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)' }}>BDT</div>
            </div>
            <div className={styles.statValue}>BDT {totalValue.toLocaleString()}</div>
          </div>
        </section>

        {rejected > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            {rejected} submission{rejected > 1 ? 's' : ''} need correction. Check status details and contact support if needed.
          </div>
        )}

        <section className="card" style={{ padding: 18, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Seller Earnings Analytics</h2>
          <div className="grid-3">
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Submitted Last 7 Days</div>
              <div style={{ color: 'var(--info)', fontSize: 24, fontWeight: 900 }}>{submitted7}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Approved Earnings</div>
              <div style={{ color: 'var(--success)', fontSize: 24, fontWeight: 900 }}>BDT {earnedValue.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Approval Rate</div>
              <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 900 }}>{user.listings.length ? Math.round((bought / user.listings.length) * 100) : 0}%</div>
            </div>
          </div>
        </section>

        {user.listings.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No submissions yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Submit single accounts or upload an Excel file to start selling.</p>
            <Link href="/sell" className="btn btn-gold">Submit Account</Link>
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
                    <div className={styles.miniLabel}>Total Buying Rate</div>
                    <div className={styles.miniValue}>BDT {group.total.toLocaleString()}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Admin Status</div>
                    <div className={styles.miniValue}>{group.status === 'pending' ? 'Waiting review' : group.status}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Review Timer</div>
                    <div className={styles.miniValue}>{group.status === 'pending' && group.oldestPending ? reviewTimer(group.oldestPending) : 'Processed'}</div>
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
