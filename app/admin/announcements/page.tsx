import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AnnouncementForm from './AnnouncementForm'
import { canAccessAdminArea } from '@/lib/permissions'

function statusLabel(ann: { isActive: boolean; scheduledAt: Date | null; expiresAt: Date | null }) {
  const now = new Date()
  if (!ann.isActive) return 'Inactive'
  if (ann.expiresAt && ann.expiresAt <= now) return 'Expired'
  if (ann.scheduledAt && ann.scheduledAt > now) return 'Scheduled'
  return 'Live'
}

export default async function AdminAnnouncementsPage() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'announcements'))) redirect('/login')

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isActive: 'desc' }, { scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Notices & Broadcasts</h1>
          <p className="page-subtitle">Schedule classes, meeting links, and important user notices.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
        <AnnouncementForm />

        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Current Notices</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No notices yet.</div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: ann.isActive ? 'var(--surface)' : 'transparent',
                  opacity: ann.isActive ? 1 : 0.55,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800 }}>{ann.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${ann.type === 'danger' ? 'danger' : ann.type === 'warning' ? 'warning' : 'success'}`}>
                        {statusLabel(ann)}
                      </span>
                      <span className="badge" style={{ background: 'var(--bg)' }}>{ann.target}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>{ann.message}</p>
                  <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Start: {ann.scheduledAt ? new Date(ann.scheduledAt).toLocaleString() : 'Now'}</span>
                    <span>Hide after: {ann.expiresAt ? new Date(ann.expiresAt).toLocaleString() : 'Manual delete'}</span>
                    {ann.link && <a href={ann.link} target="_blank" rel="noreferrer" className="text-gold">Open meeting link</a>}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
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
