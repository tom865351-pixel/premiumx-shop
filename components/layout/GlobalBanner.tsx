import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function visibleForRole(target: string, role: string) {
  if (target === 'all') return true
  if (target === 'buyers' && role === 'buyer') return true
  if (target === 'sellers' && ['seller', 'admin', 'sub-admin', 'stock-manager'].includes(role)) return true
  return false
}

function scheduleLabel(scheduledAt: Date | null) {
  if (!scheduledAt) return 'Live now'
  if (scheduledAt > new Date()) return `Starts ${new Date(scheduledAt).toLocaleString()}`
  return 'Live now'
}

export default async function GlobalBanner() {
  const authUser = await getAuthUser()
  let userRole = 'buyer'

  if (authUser) {
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } }).catch(() => null)
    if (user) userRole = user.role
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    take: 3,
  }).catch(() => [])

  const visible = announcements.filter((announcement) => visibleForRole(announcement.target, userRole))
  if (visible.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {visible.map((announcement) => {
        const bg = announcement.type === 'danger' ? 'var(--danger)' :
          announcement.type === 'warning' ? 'var(--warning)' :
          announcement.type === 'success' ? 'var(--success)' : 'var(--gold)'
        const color = announcement.type === 'warning' || announcement.type === 'gold' ? '#000' : '#fff'

        return (
          <div
            key={announcement.id}
            style={{
              background: bg,
              color,
              padding: '10px 14px',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 900, background: 'rgba(0,0,0,0.16)', borderRadius: 999, padding: '4px 9px' }}>
              {scheduleLabel(announcement.scheduledAt)}
            </span>
            <span>
              <strong>{announcement.title}:</strong> {announcement.message}
            </span>
            {announcement.link && (
              <a
                href={announcement.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '5px 12px',
                  borderRadius: 999,
                  color,
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                Join
              </a>
            )}
            <Link
              href="/live"
              style={{
                color,
                textDecoration: 'underline',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Details
            </Link>
          </div>
        )
      })}
    </div>
  )
}
