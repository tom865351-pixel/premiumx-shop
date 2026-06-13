import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

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
    orderBy: { createdAt: 'desc' },
  }).catch(() => [])

  const visible = announcements.filter((announcement) => {
    if (announcement.target === 'all') return true
    if (announcement.target === 'buyers' && userRole === 'buyer') return true
    if (
      announcement.target === 'sellers' &&
      ['seller', 'admin', 'sub-admin', 'stock-manager'].includes(userRole)
    ) {
      return true
    }
    return false
  })

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
              padding: '10px 20px',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              {announcement.type === 'success' ? 'OK' : announcement.type === 'info' ? 'i' : '!'}
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
                  padding: '4px 12px',
                  borderRadius: 20,
                  color,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                Open Link
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
