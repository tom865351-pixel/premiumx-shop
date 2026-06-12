import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminDashboard() {
  const user = await getAuthUser()
  
  if (!user || (user.role !== 'admin' && user.role !== 'sub-admin' && user.role !== 'stock-manager')) {
    redirect('/login')
  }

  const [
    userCount,
    accountCount,
    orderCount,
    reportCount,
    revenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.order.count(),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'completed' } })
  ])

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { buyer: true, account: true }
  })

  let categories = await prisma.category.findMany({
    include: { _count: { select: { accounts: { where: { status: 'sold' } } } } }
  })
  categories.sort((a, b) => b._count.accounts - a._count.accounts)
  const topCategories = categories.slice(0, 5)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of PremiumX Shop activity.</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 40 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>💰</div>
          <div>
            <div className="stat-value">৳{revenue._sum.amount || 0}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(147,51,234,0.1)', color: 'var(--purple)' }}>👥</div>
          <div>
            <div className="stat-value">{userCount}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>📦</div>
          <div>
            <div className="stat-value">{accountCount}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: reportCount > 0 ? 'var(--danger)' : '' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>🚩</div>
          <div>
            <div className="stat-value">{reportCount}</div>
            <div className="stat-label">Pending Reports</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, marginBottom: 40 }}>
        {/* Top Selling Categories */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>🏆 Top Selling Categories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCategories.map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rank #{i + 1}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{cat._count.accounts}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Accounts Sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Orders</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center">No orders yet</td></tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-mono">#{order.id.slice(-6).toUpperCase()}</td>
                      <td>{order.buyer.username}</td>
                      <td className="font-mono text-gold">৳{order.amount}</td>
                      <td>
                        <span className={`badge badge-${order.status === 'completed' ? 'success' : 'warning'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
