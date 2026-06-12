import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminReports() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const reports = await prisma.report.findMany({
    include: {
      buyer: { select: { username: true, email: true } },
      account: { select: { title: true, category: { select: { name: true, icon: true } } } },
      order: { select: { amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = reports.filter(r => r.status === 'pending').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Reports</h1>
          <p className="page-subtitle">Handle buyer complaints and disputes</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{pending}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Approved (Refunded)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>
            {reports.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Rejected</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
            {reports.filter(r => r.status === 'rejected').length}
          </div>
        </div>
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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No reports yet</td></tr>
            ) : (
              reports.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.buyer.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.buyer.email}</div>
                  </td>
                  <td>
                    <div>{r.account.category.icon} {r.account.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.account.category.name}</div>
                  </td>
                  <td className="text-gold font-mono">৳{r.order.amount.toLocaleString()}</td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: 13 }}>{r.reason}</div>
                    {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description.slice(0, 60)}...</div>}
                  </td>
                  <td>
                    <span className={`badge badge-${
                      r.status === 'approved' ? 'warning' :
                      r.status === 'rejected' ? 'success' : 'danger'
                    }`}>
                      {r.status === 'approved' ? 'Refunded' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <form action={`/api/admin/reports/${r.id}/approve`} method="POST">
                          <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#000' }} type="submit">Refund</button>
                        </form>
                        <form action={`/api/admin/reports/${r.id}/reject`} method="POST">
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} type="submit">Reject</button>
                        </form>
                      </div>
                    )}
                    {r.status !== 'pending' && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resolved</span>}
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
