import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminWithdrawals() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: { select: { username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const pending = withdrawals.filter(w => w.status === 'pending').length
  const totalPaid = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Withdrawal Requests</h1>
          <p className="page-subtitle">Manage seller withdrawal requests</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{pending}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Paid Out</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>৳{totalPaid.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Requests</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{withdrawals.length}</div>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Account Number</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No withdrawal requests yet</td></tr>
            ) : (
              withdrawals.map(w => (
                <tr key={w.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.user.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.user.email}</div>
                  </td>
                  <td className="text-gold font-mono">৳{w.amount.toLocaleString()}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
                      {w.method}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: 13 }}>{w.accountNumber}</td>
                  <td>
                    <span className={`badge badge-${
                      w.status === 'approved' ? 'success' :
                      w.status === 'rejected' ? 'danger' : 'warning'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(w.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <form action={`/api/admin/withdrawals/${w.id}/approve`} method="POST">
                          <button className="btn btn-sm btn-primary" type="submit">Pay & Approve</button>
                        </form>
                        <form action={`/api/admin/withdrawals/${w.id}/reject`} method="POST">
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} type="submit">Reject</button>
                        </form>
                      </div>
                    )}
                    {w.status !== 'pending' && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Processed</span>}
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
