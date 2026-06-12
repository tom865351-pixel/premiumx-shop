import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import DepositForm from './DepositForm'

export default async function DepositPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  const deposits = await prisma.topupRequest.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />

      <main className="container" style={{ padding: '40px 20px', flex: 1 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">💳 Add Money</h1>
            <p className="page-subtitle">Send money via bKash/Nagad/Rocket and submit your Transaction ID.</p>
          </div>
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center', borderColor: 'var(--gold)', background: 'rgba(212,175,55,0.05)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Wallet Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Grotesk' }}>৳{user.balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 32 }}>
          {/* Payment Methods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 18 }}>📱 Payment Methods</h2>

            {[
              { method: 'bKash', number: '01XXXXXXXXX', color: '#E2136E', emoji: '🩷' },
              { method: 'Nagad', number: '01XXXXXXXXX', color: '#F7941D', emoji: '🧡' },
              { method: 'Rocket', number: '01XXXXXXXXX', color: '#8B1C7E', emoji: '💜' },
            ].map(p => (
              <div key={p.method} className="card" style={{ borderColor: `${p.color}33`, background: `${p.color}08` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32 }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: p.color }}>{p.method}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--text)', marginTop: 4, letterSpacing: 2 }}>{p.number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Send Money → Personal</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="alert alert-warning">
              ⚠️ <strong>Important:</strong> Send money first, then submit the form with your exact Transaction ID. Do NOT send from business accounts.
            </div>
          </div>

          {/* Deposit Form */}
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 20 }}>📝 Submit Deposit</h2>
            <DepositForm />

            {/* History */}
            {deposits.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Recent Requests</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>TrxID</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map(d => (
                        <tr key={d.id}>
                          <td className="font-mono text-gold">৳{d.amount}</td>
                          <td style={{ textTransform: 'capitalize' }}>{d.method}</td>
                          <td className="font-mono" style={{ fontSize: 11 }}>{d.transactionId}</td>
                          <td>
                            <span className={`badge badge-${d.status === 'approved' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
