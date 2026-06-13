import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import styles from '@/app/dashboard/Dashboard.module.css'

function statusClass(status: string) {
  if (status === 'approved' || status === 'sold') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
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

        {user.listings.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No submissions yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Submit single accounts or upload an Excel file to start selling.</p>
            <Link href="/sell" className="btn btn-gold">Submit Account</Link>
          </div>
        ) : (
          <section className={styles.orders}>
            {user.listings.map((listing) => (
              <article key={listing.id} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderTitle}>{listing.title}</div>
                    <div className={styles.orderMeta}>
                      {listing.category.name} - {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${statusClass(listing.status)}`}>
                    {listing.status === 'approved' ? 'Bought' : listing.status}
                  </span>
                </div>
                <div className={styles.orderGrid}>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Username / Email</div>
                    <div className={styles.miniValue}>{listing.username}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Buying Rate</div>
                    <div className={styles.miniValue}>BDT {listing.price.toLocaleString()}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Admin Status</div>
                    <div className={styles.miniValue}>{listing.status === 'pending' ? 'Waiting review' : listing.status}</div>
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
