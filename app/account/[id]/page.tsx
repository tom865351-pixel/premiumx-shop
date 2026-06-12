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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div className="badge" style={{ background: `${account.category.color}20`, color: account.category.color, border: `1px solid ${account.category.color}40`, marginBottom: 12 }}>
                {account.category.icon} {account.category.name}
              </div>
              <h1 style={{ fontSize: 24, marginBottom: 8 }}>{account.title}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Listed by @{account.seller.username}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-gold font-mono" style={{ fontSize: 28, fontWeight: 700 }}>৳{account.price}</div>
              <div className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 8 }}>
                {isAvailable ? 'Available' : 'Sold Out / Unavailable'}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Followers / Level</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{account.followersCount?.toLocaleString() || 'N/A'}</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Account Age</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{account.accountAge || 'Unknown'}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {account.description || 'No description provided by the seller.'}
            </p>
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
      </main>
    </div>
  )
}
