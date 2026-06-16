import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

function statusBadge(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function AdminWithdrawals() {
  const user = await getAuthUser()
  if (!user || !(await canAccessAdminArea(user.role, 'withdrawals'))) redirect('/login')

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: { select: { username: true, email: true, phone: true, balance: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const pending = withdrawals.filter((withdrawal) => withdrawal.status === 'pending')
  const totalPaid = withdrawals.filter((withdrawal) => withdrawal.status === 'approved').reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingAmount = pending.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const rejected = withdrawals.filter((withdrawal) => withdrawal.status === 'rejected').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Withdrawal Requests</h1>
          <p className="page-subtitle">Pay sellers, save references, and return rejected payout holds safely.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="btn btn-gold" href="/api/admin/withdrawals/export?status=pending">Export Pending Payouts</a>
          <a className="btn btn-outline" href="/api/admin/withdrawals/export?status=approved">Export Paid Payouts</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending Requests</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>{pending.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending Amount</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>BDT {pendingAmount.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Paid Out</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>BDT {totalPaid.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Rejected</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{rejected}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 18 }}>
          Pending amounts are already reserved from seller wallets. Approving marks payment complete; rejecting returns the money automatically.
        </div>
      )}

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Account / Wallet</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No withdrawal requests yet</td></tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{withdrawal.user.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{withdrawal.user.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--gold)' }}>Balance: BDT {withdrawal.user.balance.toLocaleString()}</div>
                  </td>
                  <td className="text-gold font-mono" style={{ fontWeight: 800 }}>BDT {withdrawal.amount.toLocaleString()}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
                      {withdrawal.method}
                    </span>
                  </td>
                  <td>
                    <div className="font-mono" style={{ fontSize: 13 }}>{withdrawal.accountNumber}</div>
                    {withdrawal.user.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phone: {withdrawal.user.phone}</div>}
                  </td>
                  <td><span className={`badge badge-${statusBadge(withdrawal.status)}`}>{withdrawal.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{withdrawal.reference || withdrawal.adminNote || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(withdrawal.createdAt).toLocaleString()}</td>
                  <td>
                    {withdrawal.status === 'pending' ? (
                      <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
                        <form action={`/api/admin/withdrawals/${withdrawal.id}/approve`} method="POST" style={{ display: 'grid', gap: 8 }}>
                          <input name="reference" className="input" placeholder="Payment reference" style={{ height: 34, fontSize: 12 }} />
                          <button className="btn btn-sm btn-primary" type="submit">Mark Paid</button>
                        </form>
                        <form action={`/api/admin/withdrawals/${withdrawal.id}/reject`} method="POST" style={{ display: 'grid', gap: 8 }}>
                          <input name="adminNote" className="input" placeholder="Reject reason" style={{ height: 34, fontSize: 12 }} />
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} type="submit">Reject & Refund</button>
                        </form>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Processed</span>
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
