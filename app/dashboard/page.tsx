import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function Dashboard() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      purchases: { take: 5, orderBy: { createdAt: 'desc' }, include: { account: true } }
    }
  })

  if (!dbUser) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={dbUser as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {dbUser.username}!</h1>
            <p className="page-subtitle">Manage your account and view your purchases.</p>
          </div>
          <Link href="/browse" className="btn btn-gold">Browse Accounts</Link>
        </div>

        <div className="grid-3" style={{ marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>💰</div>
            <div>
              <div className="stat-value">৳{dbUser.balance}</div>
              <div className="stat-label">Wallet Balance</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(147,51,234,0.1)', color: 'var(--purple)' }}>🛍️</div>
            <div>
              <div className="stat-value">{dbUser.purchases.length}</div>
              <div className="stat-label">Total Purchases</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>🛡️</div>
            <div>
              <div className="stat-value">Active</div>
              <div className="stat-label">Account Status</div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Purchases</h2>
        {dbUser.purchases.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-title">No purchases yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>You haven't bought any accounts yet.</p>
            <Link href="/browse" className="btn btn-outline">Start Browsing</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Account</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dbUser.purchases.map(order => (
                  <tr key={order.id}>
                    <td className="font-mono">#{order.id.slice(-6).toUpperCase()}</td>
                    <td>{order.account.title}</td>
                    <td className="font-mono text-gold">৳{order.amount}</td>
                    <td>
                      <span className={`badge badge-${order.status === 'completed' ? 'success' : 'warning'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/orders/${order.id}`} className="btn btn-sm btn-outline">View details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
