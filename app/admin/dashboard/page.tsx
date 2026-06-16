import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getPermissionsForRole } from '@/lib/permissions'

function money(amount = 0) {
  return `BDT ${Number(amount).toLocaleString()}`
}

export default async function AdminDashboard() {
  const user = await getAuthUser()

  if (!user || (user.role !== 'admin' && user.role !== 'sub-admin' && user.role !== 'stock-manager')) {
    redirect('/login')
  }
  const permissions = await getPermissionsForRole(user.role)
  if (!permissions.dashboard) redirect('/login')

  const [
    userCount,
    sellerCount,
    pendingAccounts,
    approvedAccounts,
    soldAccounts,
    pendingReports,
    pendingDeposits,
    pendingWithdrawals,
    openTickets,
    revenue,
    payoutPending,
    recentAccounts,
    recentWithdrawals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { listings: { some: {} } } }),
    prisma.account.count({ where: { status: 'pending' } }),
    prisma.account.count({ where: { status: 'approved' } }),
    prisma.account.count({ where: { status: 'sold' } }),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.topupRequest.count({ where: { status: 'pending' } }),
    prisma.withdrawal.count({ where: { status: 'pending' } }),
    prisma.ticket.count({ where: { status: { in: ['open', 'in-progress'] } } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
    prisma.account.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { seller: true, category: true } }),
    prisma.withdrawal.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: true } }),
  ])

  const tasks = [
    { label: 'Upload result Excel', value: pendingAccounts, href: '/admin/result-batches', tone: 'success', permission: 'results' },
    { label: 'Review seller stock', value: pendingAccounts, href: '/admin/accounts', tone: 'warning', permission: 'accounts' },
    { label: 'Approve deposits', value: pendingDeposits, href: '/admin/deposits', tone: 'warning', permission: 'deposits' },
    { label: 'Pay withdrawals', value: pendingWithdrawals, href: '/admin/withdrawals', tone: 'danger', permission: 'withdrawals' },
    { label: 'Solve support tickets', value: openTickets, href: '/admin/support', tone: 'info', permission: 'support' },
    { label: 'Check reports', value: pendingReports, href: '/admin/reports', tone: 'danger', permission: 'reports' },
  ].filter((task) => permissions[task.permission as keyof typeof permissions])

  const quickLinks = [
    { href: '/admin/result-batches', label: 'Upload Result Report', className: 'btn btn-gold', permission: 'results' },
    { href: '/admin/search', label: 'Global Search', className: 'btn btn-outline', permission: 'search' },
    { href: '/admin/risk', label: 'Risk Center', className: 'btn btn-outline', permission: 'risk' },
  ].filter((link) => permissions[link.permission as keyof typeof permissions])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Command Center</h1>
          <p className="page-subtitle">Everything urgent for PremiumX operations in one clean screen.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className={link.className}>{link.label}</Link>
          ))}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Pending Stock" value={pendingAccounts} tone="warning" />
        <Stat label="Pending Payout" value={money(payoutPending._sum.amount || 0)} tone="danger" />
        <Stat label="Total Revenue" value={money(revenue._sum.amount || 0)} tone="gold" />
        <Stat label="Active Sellers" value={sellerCount} tone="success" />
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Total Users" value={userCount} tone="info" />
        <Stat label="Bought Stock" value={approvedAccounts} tone="success" />
        <Stat label="Sold Stock" value={soldAccounts} tone="gold" />
        <Stat label="Pending Reports" value={pendingReports} tone="danger" />
      </div>

      <div className="grid-2" style={{ gap: 18, marginBottom: 24 }}>
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Admin To-do</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {tasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: 12 }}>No assigned admin tasks for this role.</div>
            ) : tasks.map((task) => (
              <Link key={task.label} href={task.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text)' }}>
                <span>
                  <strong>{task.label}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Open and process now</span>
                </span>
                <span className={`badge badge-${task.tone}`} style={{ fontSize: 14 }}>{task.value}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Latest Seller Stock</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {recentAccounts.map((account) => (
              <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <span>
                  <strong>{account.title}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12 }}>@{account.seller.username} - {account.category.name}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <strong className="text-gold">{money(account.price)}</strong>
                  <span className="badge badge-muted" style={{ display: 'block', marginTop: 6 }}>{account.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18 }}>Withdrawal Control Room</h2>
          <Link href="/admin/withdrawals" className="btn btn-sm btn-outline">Open Withdrawals</Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Method</th>
                <th>Wallet</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentWithdrawals.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No withdrawals yet</td></tr>
              ) : recentWithdrawals.map((item) => (
                <tr key={item.id}>
                  <td>@{item.user.username}</td>
                  <td>{item.method.toUpperCase()}</td>
                  <td className="font-mono">{item.accountNumber}</td>
                  <td className="font-mono text-gold">{money(item.amount)}</td>
                  <td><span className={`badge badge-${item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}`}>{item.status}</span></td>
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

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="stat-card">
      <div>
        <div className={`stat-value text-${tone}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
