import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

function money(amount = 0) {
  return `BDT ${Number(amount).toLocaleString()}`
}

function when(date: Date) {
  return new Date(date).toLocaleString()
}

export default async function AdminActivityPage() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'activity'))) redirect('/login')

  const [transactions, accounts, topups, withdrawals, tickets, logins] = await Promise.all([
    prisma.transaction.findMany({ take: 12, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.account.findMany({ take: 12, orderBy: { createdAt: 'desc' }, include: { seller: true, category: true } }),
    prisma.topupRequest.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.withdrawal.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.ticket.findMany({ take: 8, orderBy: { updatedAt: 'desc' }, include: { user: true } }),
    prisma.loginHistory.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: true } }),
  ])

  const events = [
    ...transactions.map((item) => ({
      time: item.createdAt,
      type: 'Wallet',
      title: `${item.type} - ${money(item.amount)}`,
      detail: `@${item.user.username} - balance after: ${money(item.balance)} - ${item.description}`,
      tone: item.amount >= 0 ? 'success' : 'warning',
    })),
    ...accounts.map((item) => ({
      time: item.createdAt,
      type: 'Stock',
      title: `${item.title} (${item.status})`,
      detail: `@${item.seller.username} submitted ${item.category.name} - ${money(item.price)}`,
      tone: item.status === 'rejected' ? 'danger' : item.status === 'pending' ? 'warning' : 'success',
    })),
    ...topups.map((item) => ({
      time: item.createdAt,
      type: 'Deposit',
      title: `${item.method.toUpperCase()} ${money(item.amount)} (${item.status})`,
      detail: `@${item.user.username} - TrxID: ${item.transactionId || 'not set'}`,
      tone: item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning',
    })),
    ...withdrawals.map((item) => ({
      time: item.createdAt,
      type: 'Payout',
      title: `${item.method.toUpperCase()} ${money(item.amount)} (${item.status})`,
      detail: `@${item.user.username} - wallet: ${item.accountNumber}`,
      tone: item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning',
    })),
    ...tickets.map((item) => ({
      time: item.updatedAt,
      type: 'Support',
      title: `${item.subject} (${item.status})`,
      detail: `@${item.user.username} - priority: ${item.priority}`,
      tone: item.priority === 'urgent' ? 'danger' : item.priority === 'high' ? 'warning' : 'info',
    })),
    ...logins.map((item) => ({
      time: item.createdAt,
      type: 'Login',
      title: `@${item.user.username} logged in`,
      detail: `${item.ip || 'unknown IP'} - ${item.userAgent || 'unknown device'}`,
      tone: 'info',
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 40)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Center</h1>
          <p className="page-subtitle">Recent wallet, stock, payout, support, and login activity in one timeline.</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <MiniStat label="Transactions" value={transactions.length} />
        <MiniStat label="Stock Events" value={accounts.length} />
        <MiniStat label="Payout Events" value={withdrawals.length} />
        <MiniStat label="Login Events" value={logins.length} />
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {events.map((event, index) => (
            <div key={`${event.type}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
              <span className={`badge badge-${event.tone}`}>{event.type}</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block' }}>{event.title}</strong>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.detail}</span>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{when(event.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
