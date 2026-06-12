import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminDashboard() {
  const user = await getAuthUser()
  
  if (!user || user.role !== 'admin') {
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

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Orders</h2>
      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr><td colSpan={5} className="text-center">No orders yet</td></tr>
            ) : (
              recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="font-mono">#{order.id.slice(-6).toUpperCase()}</td>
                  <td>{order.buyer.username}</td>
                  <td>{order.account.title}</td>
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
  )
}
