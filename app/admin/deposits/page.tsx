import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminDeposits() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const deposits = await prisma.topupRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true, email: true, balance: true } } },
  })

  const pending = deposits.filter(d => d.status === 'pending')
  const totalApproved = deposits
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Manage Deposits</h1>
          <p className="page-subtitle">Approve or reject user deposit requests.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>⏳</div>
          <div>
            <div className="stat-value">{pending.length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>💰</div>
          <div>
            <div className="stat-value">৳{totalApproved.toLocaleString()}</div>
            <div className="stat-label">Total Deposited</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>📋</div>
          <div>
            <div className="stat-value">{deposits.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>TrxID</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 ? (
              <tr><td colSpan={7} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No deposit requests yet.</td></tr>
            ) : (
              deposits.map(dep => (
                <tr key={dep.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>@{dep.user.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wallet: ৳{dep.user.balance.toFixed(0)}</div>
                  </td>
                  <td className="font-mono text-gold" style={{ fontWeight: 700, fontSize: 16 }}>৳{dep.amount}</td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{dep.method}</span>
                  </td>
                  <td className="font-mono" style={{ fontSize: 13, letterSpacing: 1 }}>{dep.transactionId}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(dep.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${dep.status === 'approved' ? 'success' : dep.status === 'pending' ? 'warning' : 'danger'}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td>
                    {dep.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <form action={`/api/admin/deposits/${dep.id}/approve`} method="POST">
                          <button type="submit" className="btn btn-sm btn-gold">✅ Approve</button>
                        </form>
                        <form action={`/api/admin/deposits/${dep.id}/reject`} method="POST">
                          <button type="submit" className="btn btn-sm btn-danger">❌ Reject</button>
                        </form>
                      </div>
                    )}
                    {dep.status !== 'pending' && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {dep.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
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
