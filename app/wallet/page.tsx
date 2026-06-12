import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import TopupModal from './TopupModal'
import WithdrawModal from './WithdrawModal'

export default async function WalletPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      topupRequests: { orderBy: { createdAt: 'desc' }, take: 3 },
      withdrawals: { orderBy: { createdAt: 'desc' }, take: 3 },
    }
  })
  
  if (!user) redirect('/login')

  const totalTopup = user.transactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0)
  const totalSpent = user.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + Math.abs(t.amount), 0)
  const pendingTopups = user.topupRequests.filter(t => t.status === 'pending').length
  const pendingWithdrawals = user.withdrawals.filter(w => w.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 1000 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Wallet</h1>
            <p className="page-subtitle">Manage your balance, topup and withdraw funds.</p>
          </div>
        </div>

        {/* Balance Card + Quick Stats */}
        <div className="grid-3" style={{ marginBottom: 32, gap: 20 }}>
          <div className="card card-glass" style={{ textAlign: 'center', padding: '32px 20px', gridColumn: 'span 1' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Available Balance</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Grotesk', marginBottom: 16 }}>
              ৳{user.balance.toLocaleString()}
            </div>
            <TopupModal />
            <WithdrawModal balance={user.balance} />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>💰 Total Topped Up</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>৳{totalTopup.toLocaleString()}</div>
            {pendingTopups > 0 && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>⏳ {pendingTopups} pending topup request{pendingTopups > 1 ? 's' : ''}</div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>🛍️ Total Spent</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>৳{totalSpent.toLocaleString()}</div>
            {pendingWithdrawals > 0 && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>⏳ {pendingWithdrawals} pending withdrawal{pendingWithdrawals > 1 ? 's' : ''}</div>
            )}
          </div>
        </div>

        {/* How to add funds */}
        <div className="card" style={{ padding: 20, marginBottom: 32, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>📖 How to add funds?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              1. Send money to our bKash / Nagad number.<br />
              2. Copy the Transaction ID.<br />
              3. Click &quot;Request Topup&quot; and submit the ID &amp; amount.<br />
              4. Admin will verify and add balance within a few minutes.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, minWidth: 200 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>📱 bKash</span>
              <span className="text-gold font-mono" style={{ fontSize: 14 }}>017XXXXXXXX</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>📱 Nagad</span>
              <span className="text-gold font-mono" style={{ fontSize: 14 }}>017XXXXXXXX</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>📋 Transaction History</h2>
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
                <tr><td colSpan={6} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>No transactions yet</td></tr>
              ) : (
                user.transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>#{tx.id.slice(-6).toUpperCase()}</td>
                    <td>
                      <span className="badge" style={{
                        background: tx.type === 'topup' ? 'rgba(16,185,129,0.15)' : tx.type === 'purchase' ? 'rgba(239,68,68,0.15)' : tx.type === 'refund' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.1)',
                        color: tx.type === 'topup' ? 'var(--success)' : tx.type === 'purchase' ? 'var(--danger)' : tx.type === 'refund' ? 'var(--gold)' : 'var(--text-secondary)'
                      }}>
                        {tx.type === 'topup' ? '💰 Topup' : tx.type === 'purchase' ? '🛍️ Purchase' : tx.type === 'sale' ? '💸 Sale' : tx.type === 'refund' ? '↩️ Refund' : tx.type === 'withdrawal' ? '📤 Withdraw' : tx.type}
                      </span>
                    </td>
                    <td className={`font-mono ${tx.amount > 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 700 }}>
                      {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="font-mono text-gold">৳{tx.balance.toLocaleString()}</td>
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
