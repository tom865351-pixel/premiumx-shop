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

  const completed = orders.filter((order) => order.status === 'completed')
  const pending = orders.filter((order) => order.status === 'pending')
  const totalRevenue = completed.reduce((sum, order) => sum + order.commission, 0)
  const totalVolume = completed.reduce((sum, order) => sum + order.amount, 0)
  const pendingPayout = pending.reduce((sum, order) => sum + order.sellerEarning, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Monitor orders, commission, and seller payouts</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{orders.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending Payout</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>BDT {pendingPayout.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Commission Earned</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>BDT {totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Completed Volume</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>BDT {totalVolume.toLocaleString()}</div>
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
              <th>Seller Payout</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Protection Ends</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders yet</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{order.id.slice(-8).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.buyer.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.buyer.email}</div>
                  </td>
                  <td>
                    <div>{order.account.category.icon} {order.account.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.account.category.name}</div>
                  </td>
                  <td className="text-gold font-mono">BDT {order.amount.toLocaleString()}</td>
                  <td className="font-mono" style={{ color: 'var(--success)' }}>BDT {order.sellerEarning.toLocaleString()}</td>
                  <td className="font-mono" style={{ color: 'var(--gold)' }}>BDT {order.commission.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${
                      order.status === 'completed' ? 'success' :
                      order.status === 'refunded' ? 'warning' :
                      order.status === 'disputed' ? 'danger' : 'warning'
                    }`}>
                      {order.status === 'pending' ? 'Pending payout' : order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(order.reportWindowEnd).toLocaleString()}
                  </td>
                  <td>
                    {order.status === 'pending' ? (
                      <form action={`/api/admin/orders/${order.id}/release`} method="POST">
                        <button type="submit" className="btn btn-sm btn-gold">Release</button>
                      </form>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Done</span>
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
