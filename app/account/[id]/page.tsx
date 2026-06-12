import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import PurchaseButton from './PurchaseButton'

export default async function AccountDetailsPage({ params }: { params: { id: string } }) {
  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      seller: { select: { username: true } }
    }
  })

  if (!account) return notFound()

  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null

  const isAvailable = account.status === 'approved'
  const isOwner = authUser?.userId === account.sellerId

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 800 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="grid-2" style={{ gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="badge" style={{ 
                    background: `${account.category.color}15`, 
                    color: account.category.color, 
                    border: `1px solid ${account.category.color}40`, 
                    marginBottom: 16,
                    backdropFilter: 'blur(8px)',
                    fontWeight: 600
                  }}>
                    {account.category.icon} {account.category.name}
                  </div>
                  <h1 style={{ fontSize: 28, marginBottom: 8, fontWeight: 800, lineHeight: 1.2 }}>{account.title}</h1>
                  <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(45deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>{account.seller.username.charAt(0).toUpperCase()}</span>
                    Listed by @{account.seller.username}
                  </p>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Followers / Level</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>{account.followersCount?.toLocaleString() || 'N/A'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Account Age</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#818cf8' }}>{account.accountAge || 'Unknown'}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#38bdf8' }}>📄</span> Description
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                  {account.description || 'No description provided by the seller.'}
                </p>
              </div>
            </div>

            {/* Sidebar / Checkout Area */}
            <div>
              <div style={{ 
                background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0) 100%)',
                padding: 32, 
                borderRadius: 24, 
                border: '1px solid rgba(14, 165, 233, 0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'sticky',
                top: 100
              }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Price</div>
                  <div className="text-gold font-mono" style={{ fontSize: 42, fontWeight: 800, textShadow: '0 0 20px rgba(234, 179, 8, 0.3)', lineHeight: 1 }}>৳{account.price}</div>
                  <div style={{ marginTop: 16 }}>
                    {isAvailable ? (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px' }}>
                        ✅ Available for instant delivery
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px' }}>
                        ❌ Sold Out / Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {!isOwner ? (
                  <PurchaseButton 
                    accountId={account.id} 
                    price={account.price} 
                    isAvailable={isAvailable} 
                    isLoggedIn={!!authUser} 
                  />
                ) : (
                  <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, textAlign: 'center' }}>
                    You are the seller of this account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
