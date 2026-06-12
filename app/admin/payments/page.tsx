import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminPayments() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const topups = await prisma.topupRequest.findMany({
    include: { user: { select: { username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const pending = topups.filter(t => t.status === 'pending').length
  const totalApproved = topups.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Topup Requests</h1>
          <p className="page-subtitle">Manage user balance topup requests</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending Requests</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{pending}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Approved (BDT)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>৳{totalApproved.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Requests</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{topups.length}</div>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>TxID</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topups.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No topup requests yet</td></tr>
            ) : (
              topups.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.user.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.user.email}</div>
                  </td>
                  <td className="text-gold font-mono">৳{t.amount.toLocaleString()}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
                      {t.method}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.transactionId || '—'}</td>
                  <td>
                    <span className={`badge badge-${
                      t.status === 'approved' ? 'success' :
                      t.status === 'rejected' ? 'danger' : 'warning'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {t.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <form action={`/api/admin/topups/${t.id}/approve`} method="POST">
                          <button className="btn btn-sm btn-primary" type="submit">Approve</button>
                        </form>
                        <form action={`/api/admin/topups/${t.id}/reject`} method="POST">
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} type="submit">Reject</button>
                        </form>
                      </div>
                    )}
                    {t.status !== 'pending' && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Processed</span>}
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
