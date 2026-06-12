import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function OrdersPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      purchases: {
        orderBy: { createdAt: 'desc' },
        include: { account: { include: { category: true } } }
      }
    }
  })
  
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 1000 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Orders</h1>
            <p className="page-subtitle">View your purchased accounts and their details.</p>
          </div>
        </div>

        {user.purchases.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-title">No orders yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>You haven't purchased any accounts.</p>
          </div>
        ) : (
          <div className="grid-1" style={{ gap: 20 }}>
            {user.purchases.map(order => (
              <div key={order.id} className="card" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 40, padding: 20, background: 'var(--surface)', borderRadius: 12 }}>
                  {order.account.category.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18 }}>{order.account.title}</h3>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  
                  <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Username / Email</div>
                      <div className="font-mono" style={{ fontWeight: 600 }}>{order.account.username}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Password</div>
                      <div className="font-mono" style={{ fontWeight: 600 }}>{order.account.password}</div>
                    </div>
                  </div>

                  {order.account.twoFASecret && (
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>2FA Secret Code</div>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--purple)' }}>{order.account.twoFASecret}</div>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Purchased on {new Date(order.createdAt).toLocaleDateString()} for ৳{order.amount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
