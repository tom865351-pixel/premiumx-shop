import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import Link from 'next/link'
import { canAccessAdminArea } from '@/lib/permissions'

export default async function AdminSupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'support'))) redirect('/login')

  const statusFilter = searchParams?.status
  const tickets = await prisma.ticket.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { username: true, email: true } },
      _count: { select: { replies: true } },
      replies: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  const allTickets = await prisma.ticket.findMany({ select: { status: true, priority: true } })
  const openCount    = allTickets.filter(t => t.status === 'open').length
  const progressCount = allTickets.filter(t => t.status === 'in-progress').length
  const closedCount  = allTickets.filter(t => t.status === 'closed').length
  const urgentCount  = allTickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length

  const priorityColor: Record<string, string> = {
    urgent: 'danger', high: 'warning', normal: 'muted', low: 'muted'
  }
  const statusColor: Record<string, string> = {
    open: 'success', 'in-progress': 'warning', closed: 'muted'
  }
  const priorityIcon: Record<string, string> = {
    urgent: '🚨', high: '⚠️', normal: '📩', low: '📝'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎫 Support Tickets</h1>
          <p className="page-subtitle">Handle user support requests and disputes.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Open', value: openCount, color: '#f59e0b', icon: '📬' },
          { label: 'In Progress', value: progressCount, color: '#38bdf8', icon: '⚙️' },
          { label: 'Closed', value: closedCount, color: '#10b981', icon: '✅' },
          { label: '🚨 Urgent', value: urgentCount, color: '#ef4444', icon: '🚨' },
          { label: 'Total', value: allTickets.length, color: 'var(--text)', icon: '📋' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: '', count: allTickets.length },
          { label: '📬 Open', value: 'open', count: openCount },
          { label: '⚙️ In Progress', value: 'in-progress', count: progressCount },
          { label: '✅ Closed', value: 'closed', count: closedCount },
        ].map(tab => {
          const isActive = (statusFilter || '') === tab.value
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/support?status=${tab.value}` : '/admin/support'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                border: `2px solid ${isActive ? '#38bdf8' : 'var(--border)'}`,
                background: isActive ? 'rgba(56,189,248,0.1)' : 'var(--surface)',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              <span style={{
                background: isActive ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#000' : 'var(--text-muted)',
                borderRadius: 20, padding: '0 7px', fontSize: 11, fontWeight: 800
              }}>{tab.count}</span>
            </Link>
          )
        })}
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(56,189,248,0.05)',
          fontSize: 13, color: 'var(--text-muted)', fontWeight: 600
        }}>
          Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          {statusFilter ? ` — ${statusFilter}` : ' (all)'}
        </div>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Priority</th>
              <th>User</th>
              <th>Subject</th>
              <th>Replies</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map(t => {
                const lastReply = t.replies[0]
                const isUnreplied = t._count.replies === 0 || (lastReply && !lastReply.isAdmin)
                return (
                  <tr key={t.id} style={{ background: isUnreplied && t.status !== 'closed' ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                    <td>
                      <span style={{ fontSize: 18 }}>{priorityIcon[t.priority] || '📩'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>@{t.user.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.user.email}</div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t.subject}</div>
                      {isUnreplied && t.status !== 'closed' && (
                        <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                          AWAITING REPLY
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {t._count.replies === 0
                        ? <span style={{ color: 'var(--danger)', fontSize: 13 }}>0</span>
                        : <span style={{ color: 'var(--success)' }}>{t._count.replies}</span>
                      }
                    </td>
                    <td>
                      <span className={`badge badge-${statusColor[t.status] || 'muted'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.updatedAt).toLocaleDateString('en-BD', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/support/${t.id}`}
                        className="btn btn-sm btn-outline"
                        style={{
                          borderColor: isUnreplied && t.status !== 'closed' ? '#f59e0b' : undefined,
                          color: isUnreplied && t.status !== 'closed' ? '#f59e0b' : undefined,
                          padding: '4px 12px', fontSize: 12
                        }}
                      >
                        {t.status === 'closed' ? '👁️ View' : '💬 Reply'}
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
