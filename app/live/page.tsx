import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'
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

  const [notices, rawResources] = await Promise.all([
    prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    }),
    getSetting('live_resources'),
  ])

  const visible = notices.filter((notice) => visibleForRole(notice.target, user.role))
  const normalizedResources = rawResources.includes('Instagram account opening class recording')
    ? 'Instagram class time 10:00 am-12:00 pm\nInstagram class time 7:30pm-9:00 pm'
    : rawResources
  const resources = normalizedResources
    .split('\n')
    .map((line) => {
      const [title, href] = line.split('|').map((item) => item?.trim())
      return title ? { title, href: href || '' } : null
    })
    .filter(Boolean) as { title: string; href: string }[]

  return (
    <div className={styles.shell}>
      <Navbar user={user as any} />
      <main className={`container ${styles.main}`}>
        <Link href="/dashboard" className={styles.backLink}>
          Back
        </Link>

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

        {resources.length > 0 && (
          <section className={styles.resources}>
            <div>
              <div className={styles.eyebrow}>Class schedule</div>
              <h2 className={styles.resourceTitle}>Class Time</h2>
            </div>
            <div className={styles.resourceGrid}>
              {resources.map((resource) => (
                resource.href ? (
                <a key={`${resource.title}-${resource.href}`} href={resource.href} className={styles.resourceCard}>
                  <span>{resource.title}</span>
                  <strong>Open</strong>
                </a>
                ) : (
                  <div key={resource.title} className={styles.resourceCard}>
                    <span>{resource.title}</span>
                    <strong>Scheduled</strong>
                  </div>
                )
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
