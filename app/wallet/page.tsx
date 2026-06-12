import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import TopupModal from './TopupModal'

export default async function WalletPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      topupRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
    }
  })
  
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 1000 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Wallet</h1>
            <p className="page-subtitle">Add funds and view transaction history.</p>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 40 }}>
          <div className="card card-glass" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Grotesk', marginBottom: 8 }}>
              ৳{user.balance}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Available Balance</div>
            <TopupModal />
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16 }}>How to add funds?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              1. Send money to our official numbers below.<br/>
              2. Copy the Transaction ID.<br/>
              3. Click "Request Topup" and submit the details.<br/>
              4. Admin will verify and add the balance shortly.
            </p>
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>bKash (Personal)</span>
                <span className="text-gold font-mono">017XXXXXXXX</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Nagad (Personal)</span>
                <span className="text-gold font-mono">017XXXXXXXX</span>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Transactions</h2>
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center">No transactions yet</td></tr>
              ) : (
                user.transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-mono">#{tx.id.slice(-6).toUpperCase()}</td>
                    <td>
                      <span className={`badge`} style={{ background: 'rgba(255,255,255,0.1)' }}>{tx.type}</span>
                    </td>
                    <td className={`font-mono ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td>{tx.description}</td>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
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
