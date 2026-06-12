import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function GlobalBanner() {
  const authUser = await getAuthUser()
  let userRole = 'buyer'

  if (authUser) {
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (user) userRole = user.role
  }

  // Fetch active announcements that haven't expired
  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ],
      // We assume `target` can be 'all', 'buyers', 'sellers'
    },
    orderBy: { createdAt: 'desc' }
  })

  // Filter based on role
  const visible = announcements.filter(a => {
    if (a.target === 'all') return true
    if (a.target === 'buyers' && userRole === 'buyer') return true
    if (a.target === 'sellers' && (userRole === 'seller' || userRole === 'admin' || userRole === 'sub-admin' || userRole === 'stock-manager')) return true
    return false
  })

  if (visible.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {visible.map(ann => {
        const bg = ann.type === 'danger' ? 'var(--danger)' :
                   ann.type === 'warning' ? 'var(--warning)' :
                   ann.type === 'success' ? 'var(--success)' : 'var(--gold)'
        const color = ann.type === 'warning' || ann.type === 'gold' ? '#000' : '#fff'

        return (
          <div key={ann.id} style={{
            background: bg,
            color,
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 18 }}>
              {ann.type === 'danger' ? '🚨' : ann.type === 'warning' ? '⚠️' : ann.type === 'success' ? '✅' : '📢'}
            </span>
            <span>
              <strong>{ann.title}:</strong> {ann.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
