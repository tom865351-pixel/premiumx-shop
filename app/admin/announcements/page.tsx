import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AnnouncementForm from './AnnouncementForm'

export default async function AdminAnnouncementsPage() {
  const authUser = await getAuthUser()
  if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'sub-admin')) redirect('/login')

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📢 Announcements & Broadcasts</h1>
          <p className="page-subtitle">Manage site-wide banners and alerts.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        <AnnouncementForm />

        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Current Announcements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No announcements.</div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} style={{
                  padding: 16,
                  borderRadius: 8,
                  border: `1px solid var(--border)`,
                  opacity: ann.isActive ? 1 : 0.5
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{ann.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className={`badge badge-${ann.type === 'danger' ? 'danger' : ann.type === 'warning' ? 'warning' : 'success'}`}>
                        {ann.type}
                      </span>
                      <span className="badge" style={{ background: 'var(--surface)' }}>{ann.target}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{ann.message}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{ann.isActive ? '🟢 Active' : '⚫ Inactive'}</span>
                    <form action={async () => {
                      'use server'
                      await prisma.announcement.delete({ where: { id: ann.id } })
                    }}>
                      <button type="submit" className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
