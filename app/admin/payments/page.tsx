import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function money(amount = 0) {
  return `BDT ${Number(amount).toLocaleString()}`
}

function statusTone(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function AdminPayments() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const [topups, withdrawals, transactions] = await Promise.all([
    prisma.topupRequest.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.withdrawal.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.transaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      where: { type: { in: ['topup', 'withdrawal', 'sale', 'refund'] } },
      include: { user: true },
    }),
  ])

  const pendingTopups = topups.filter((item) => item.status === 'pending')
  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'pending')
  const autoTopups = topups.filter((item) => item.method === 'zinipay' || item.adminNote?.toLowerCase().includes('zinipay'))
  const pendingPayoutAmount = pendingWithdrawals.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Monitor</h1>
          <p className="page-subtitle">Track manual deposits, ZiniPay auto payments, seller withdrawals, and wallet transactions.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/deposits" className="btn btn-outline">Manual Deposits</Link>
          <Link href="/admin/withdrawals" className="btn btn-gold">Withdrawals</Link>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <PayStat label="Pending Deposits" value={pendingTopups.length} tone="warning" />
        <PayStat label="Pending Payouts" value={pendingWithdrawals.length} tone="warning" />
        <PayStat label="Payout Amount" value={money(pendingPayoutAmount)} tone="gold" />
        <PayStat label="ZiniPay Records" value={autoTopups.length} tone="success" />
      </div>

      <div className="grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <section className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Latest Add Money Requests</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {topups.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span>
                  <strong>@{item.user.username}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12 }}>{item.method.toUpperCase()} - {item.transactionId || 'no TrxID'}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <strong className="text-gold">{money(item.amount)}</strong>
                  <span className={`badge badge-${statusTone(item.status)}`} style={{ display: 'block', marginTop: 6 }}>{item.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Latest Withdrawal Requests</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {withdrawals.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span>
                  <strong>@{item.user.username}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12 }}>{item.method.toUpperCase()} - {item.accountNumber}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <strong className="text-gold">{money(item.amount)}</strong>
                  <span className={`badge badge-${statusTone(item.status)}`} style={{ display: 'block', marginTop: 6 }}>{item.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginBottom: 14 }}>Wallet Transaction Stream</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td>@{item.user.username}</td>
                  <td><span className="badge badge-muted">{item.type}</span></td>
                  <td className="font-mono text-gold">{money(item.amount)}</td>
                  <td className="font-mono">{money(item.balance)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.description}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function PayStat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="stat-card">
      <div>
        <div className={`stat-value text-${tone}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
