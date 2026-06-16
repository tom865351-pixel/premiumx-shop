import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

function statusBadge(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function AdminDeposits() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'deposits'))) redirect('/login')

  const deposits = await prisma.topupRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true, email: true, balance: true } } },
  })

  const pending = deposits.filter((deposit) => deposit.status === 'pending')
  const totalApproved = deposits
    .filter((deposit) => deposit.status === 'approved')
    .reduce((sum, deposit) => sum + deposit.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Wallet Deposits</h1>
          <p className="page-subtitle">Approve manual add money requests from the single wallet system.</p>
        </div>
        <a href="/admin/payments" className="btn btn-outline">Open Payment Monitor</a>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>WAIT</div>
          <div>
            <div className="stat-value">{pending.length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>BDT</div>
          <div>
            <div className="stat-value">BDT {totalApproved.toLocaleString()}</div>
            <div className="stat-label">Total Added</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>ALL</div>
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
              <tr><td colSpan={7} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No add money requests yet.</td></tr>
            ) : (
              deposits.map((deposit) => (
                <tr key={deposit.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>@{deposit.user.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wallet: BDT {deposit.user.balance.toFixed(0)}</div>
                  </td>
                  <td className="font-mono text-gold" style={{ fontWeight: 800, fontSize: 16 }}>BDT {deposit.amount.toLocaleString()}</td>
                  <td><span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{deposit.method}</span></td>
                  <td className="font-mono" style={{ fontSize: 13, letterSpacing: 1 }}>{deposit.transactionId || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(deposit.createdAt).toLocaleString()}</td>
                  <td><span className={`badge badge-${statusBadge(deposit.status)}`}>{deposit.status}</span></td>
                  <td>
                    {deposit.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <form action={`/api/admin/deposits/${deposit.id}/approve`} method="POST">
                          <button type="submit" className="btn btn-sm btn-gold">Approve</button>
                        </form>
                        <form action={`/api/admin/deposits/${deposit.id}/reject`} method="POST">
                          <button type="submit" className="btn btn-sm btn-danger">Reject</button>
                        </form>
                        {deposit.transactionId && (
                          <a className="btn btn-sm btn-outline" href={`/admin/payments?tx=${deposit.transactionId}`}>
                            Track TrxID
                          </a>
                        )}
                      </div>
                    )}
                    {deposit.status !== 'pending' && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {deposit.status === 'approved' ? 'Approved' : deposit.status === 'cancelled' ? 'Cancelled' : 'Rejected'}
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
