import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminOrders() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const orders = await prisma.order.findMany({
    include: {
      buyer: { select: { username: true, email: true } },
      account: { select: { title: true, category: { select: { name: true, icon: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.commission, 0)
  const totalVolume = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Monitor all transactions and orders</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{orders.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
            {orders.filter(o => o.status === 'completed').length}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Commission Earned</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>৳{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Volume</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>৳{totalVolume.toLocaleString()}</div>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No orders yet</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id}>
                  <td className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{o.id.slice(-8).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.buyer.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.buyer.email}</div>
                  </td>
                  <td>
                    <div>{o.account.category.icon} {o.account.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.account.category.name}</div>
                  </td>
                  <td className="text-gold font-mono">৳{o.amount.toLocaleString()}</td>
                  <td className="font-mono" style={{ color: 'var(--success)' }}>৳{o.commission.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${
                      o.status === 'completed' ? 'success' :
                      o.status === 'refunded' ? 'warning' :
                      o.status === 'disputed' ? 'danger' : 'warning'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(o.createdAt).toLocaleDateString()}
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
