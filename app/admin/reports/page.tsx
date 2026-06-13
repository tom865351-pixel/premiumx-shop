import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminReports() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const reports = await prisma.report.findMany({
    include: {
      buyer: { select: { username: true, email: true } },
      account: { select: { title: true, username: true, category: { select: { name: true, icon: true } } } },
      order: { select: { amount: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = reports.filter(r => r.status === 'pending').length
  const approved = reports.filter(r => r.status === 'approved').length
  const rejected = reports.filter(r => r.status === 'rejected').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Center</h1>
          <p className="page-subtitle">Review buyer disputes, refund valid reports, and reject invalid claims.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Stat label="Pending Disputes" value={pending} tone="danger" />
        <Stat label="Refunded" value={approved} tone="warning" />
        <Stat label="Rejected" value={rejected} tone="success" />
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reports yet</td></tr>
            ) : (
              reports.map(report => (
                <tr key={report.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>@{report.buyer.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{report.buyer.email}</div>
                  </td>
                  <td>
                    <div>{report.account.category.icon} {report.account.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{report.account.category.name} - {report.account.username}</div>
                  </td>
                  <td className="text-gold font-mono">BDT {report.order.amount.toLocaleString()}</td>
                  <td style={{ maxWidth: 240 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{report.reason}</div>
                    {report.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{report.description.slice(0, 90)}</div>}
                    {report.adminNote && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>Admin note: {report.adminNote}</div>}
                  </td>
                  <td>
                    <span className={`badge badge-${report.status === 'approved' ? 'warning' : report.status === 'rejected' ? 'success' : 'danger'}`}>
                      {report.status === 'approved' ? 'Refunded' : report.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {report.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <form action={`/api/admin/reports/${report.id}/approve`} method="POST">
                          <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#000' }} type="submit">Refund</button>
                        </form>
                        <form action={`/api/admin/reports/${report.id}/reject`} method="POST">
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} type="submit">Reject</button>
                        </form>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resolved</span>
                    )}
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

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="stat-card">
      <div>
        <div className={`stat-value text-${tone}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
