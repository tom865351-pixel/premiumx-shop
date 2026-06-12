import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminSupportPage() {
  const authUser = await getAuthUser()
  if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'sub-admin')) redirect('/login')

  const tickets = await prisma.ticket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { username: true, email: true } },
      _count: { select: { replies: true } },
      replies: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎫 Support Tickets</h1>
          <p className="page-subtitle">Handle user support requests and disputes.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Open Tickets</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{openCount}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Urgent</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{urgentCount}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Tickets</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{tickets.length}</div>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Replies</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={7} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>No tickets yet</td></tr>
            ) : (
              tickets.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.user.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.user.email}</div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.subject}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'success'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{t._count.replies}</td>
                  <td>
                    <span className={`badge badge-${t.status === 'open' ? 'success' : t.status === 'in-progress' ? 'warning' : 'danger'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/support/${t.id}`} className="btn btn-sm btn-outline">Reply</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
