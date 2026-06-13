import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import WithdrawModal from './WithdrawModal'
import DepositForm from '@/app/deposit/DepositForm'

function txLabel(type: string) {
  if (type === 'topup') return 'Topup'
  if (type === 'purchase') return 'Purchase'
  if (type === 'sale') return 'Sale'
  if (type === 'refund') return 'Refund'
  if (type === 'withdrawal') return 'Withdraw'
  if (type === 'referral') return 'Referral'
  return type
}

function badgeColor(type: string) {
  if (type === 'topup' || type === 'sale' || type === 'referral') return { background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }
  if (type === 'purchase' || type === 'withdrawal') return { background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }
  if (type === 'refund') return { background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }
  return { background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }
}

function statusBadge(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function WalletPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      topupRequests: { orderBy: { createdAt: 'desc' }, take: 8 },
      withdrawals: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  })

  if (!user) redirect('/login')

  const totalTopup = user.transactions.filter((tx) => tx.type === 'topup').reduce((sum, tx) => sum + tx.amount, 0)
  const totalSales = user.transactions.filter((tx) => tx.type === 'sale').reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawn = user.withdrawals.filter((withdrawal) => withdrawal.status === 'approved').reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingWithdrawals = user.withdrawals.filter((withdrawal) => withdrawal.status === 'pending')
  const pendingHold = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingTopups = user.topupRequests.filter((topup) => topup.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />

      <main className="container" style={{ padding: '32px 20px 108px', flex: 1, maxWidth: 1100 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Seller Wallet</h1>
            <p className="page-subtitle">Add money, withdraw seller earnings, and track every wallet movement in one place.</p>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 24, gap: 16 }}>
          <div className="card card-glass" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Available Balance</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--gold)', fontFamily: 'Space Grotesk', marginBottom: 14 }}>
              BDT {user.balance.toLocaleString()}
            </div>
            <WithdrawModal balance={user.balance} />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Pending Withdrawal Hold</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>BDT {pendingHold.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              {pendingWithdrawals.length} pending payout request{pendingWithdrawals.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Paid Out</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>BDT {totalWithdrawn.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Total seller sales: BDT {totalSales.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Total Topped Up</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>BDT {totalTopup.toLocaleString()}</div>
            {pendingTopups > 0 && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>{pendingTopups} pending topup request{pendingTopups > 1 ? 's' : ''}</div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>Payout Rules</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Minimum withdrawal is BDT 100. Requested amount is reserved instantly. Admin pays manually and adds a reference when approving.
            </p>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 18, marginBottom: 28, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Add Money</h2>
            <DepositForm />
          </div>

          <div>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Recent Add Money Requests</h2>
            <div className="table-container card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>TrxID</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.topupRequests.length === 0 ? (
                    <tr><td colSpan={5} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>No add money requests yet</td></tr>
                  ) : (
                    user.topupRequests.map((topup) => (
                      <tr key={topup.id}>
                        <td className="font-mono text-gold" style={{ fontWeight: 800 }}>BDT {topup.amount.toLocaleString()}</td>
                        <td style={{ textTransform: 'uppercase' }}>{topup.method}</td>
                        <td className="font-mono" style={{ fontSize: 12 }}>{topup.transactionId || '-'}</td>
                        <td><span className={`badge badge-${statusBadge(topup.status)}`}>{topup.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(topup.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Recent Withdrawals</h2>
        <div className="table-container card" style={{ marginBottom: 28 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Account</th>
                <th>Status</th>
                <th>Reference / Note</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {user.withdrawals.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>No withdrawals yet</td></tr>
              ) : (
                user.withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="font-mono text-gold" style={{ fontWeight: 800 }}>BDT {withdrawal.amount.toLocaleString()}</td>
                    <td style={{ textTransform: 'uppercase' }}>{withdrawal.method}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{withdrawal.accountNumber}</td>
                    <td><span className={`badge badge-${statusBadge(withdrawal.status)}`}>{withdrawal.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{withdrawal.reference || withdrawal.adminNote || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                    <td>
                      {withdrawal.status === 'pending' ? (
                        <form action={`/api/withdraw/${withdrawal.id}/cancel`} method="POST">
                          <button className="btn btn-sm btn-outline" type="submit">Cancel</button>
                        </form>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Transaction History</h2>
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
              ) : (
                user.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>#{tx.id.slice(-6).toUpperCase()}</td>
                    <td><span className="badge" style={badgeColor(tx.type)}>{txLabel(tx.type)}</span></td>
                    <td className={`font-mono ${tx.amount > 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 800 }}>
                      {tx.amount > 0 ? '+' : '-'}BDT {Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="font-mono text-gold">BDT {tx.balance.toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tx.description}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
