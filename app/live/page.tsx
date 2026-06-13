import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import styles from './Live.module.css'

function visibleForRole(target: string, role: string) {
  if (target === 'all') return true
  if (target === 'buyers' && role === 'buyer') return true
  if (target === 'sellers' && ['seller', 'admin', 'sub-admin', 'stock-manager'].includes(role)) return true
  return false
}

function statusText(scheduledAt: Date | null) {
  if (!scheduledAt) return 'Live now'
  if (scheduledAt > new Date()) return `Starts ${new Date(scheduledAt).toLocaleString()}`
  return 'Live now'
}

export default async function LivePage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      username: true,
      email: true,
      balance: true,
      role: true,
      preferredCurrency: true,
      preferredLanguage: true,
    },
  })
  if (!user) redirect('/login')

  const notices = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  })

  const visible = notices.filter((notice) => visibleForRole(notice.target, user.role))

  return (
    <div className={styles.shell}>
      <Navbar user={user as any} />
      <main className={`container ${styles.main}`}>
        <section className={styles.hero}>
          <div className={styles.eyebrow}>Live classes and notices</div>
          <h1 className={styles.title}>Live Sessions</h1>
          <p className={styles.subtitle}>
            See when classes start, what will be shown, and join directly when the admin shares a meeting link.
          </p>
        </section>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            No live sessions are scheduled right now. Check again later or contact support.
          </div>
        ) : (
          <section className={styles.grid}>
            {visible.map((notice) => (
              <article key={notice.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardTitle}>{notice.title}</div>
                    <div className={styles.meta}>
                      <span className={styles.pill}>{statusText(notice.scheduledAt)}</span>
                      <span className={styles.pill}>{notice.target}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${notice.type === 'danger' ? 'danger' : notice.type === 'warning' ? 'warning' : 'success'}`}>
                    {notice.type}
                  </span>
                </div>

                <div className={styles.message}>{notice.message}</div>

                <div className={styles.actions}>
                  {notice.link ? (
                    <a href={notice.link} target="_blank" rel="noreferrer" className="btn btn-gold">
                      Join / Open Link
                    </a>
                  ) : (
                    <span className="btn btn-outline" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                      Link coming soon
                    </span>
                  )}
                  <a href="/support" className="btn btn-outline">Ask Support</a>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
