import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function NotificationsPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId }
  })

  if (!user) redirect('/login')

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 800 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Stay updated on your account activity.</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🔕</div>
            <div className="empty-state-title">No notifications</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>You are all caught up!</p>
          </div>
        ) : (
          <div className="grid-1" style={{ gap: 16 }}>
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className="card" 
                style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'flex-start',
                  borderLeft: notif.isRead ? 'none' : '4px solid var(--gold)'
                }}
              >
                <div style={{ fontSize: 24 }}>
                  {notif.type === 'purchase' ? '🛍️' : notif.type === 'sale' ? '💰' : notif.type === 'topup' ? '💳' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{notif.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
