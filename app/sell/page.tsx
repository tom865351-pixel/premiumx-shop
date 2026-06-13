import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import SellForm from './SellForm'
import Navbar from '@/components/layout/Navbar'

export default async function SellPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  // Optional: Only allow sellers to access this page
  // if (user.role !== 'seller' && user.role !== 'admin') {
  //   return <div>You don't have permission to sell. Contact admin to upgrade your account.</div>
  // }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const sellerStats = await prisma.account.groupBy({
    by: ['status'],
    where: { sellerId: user.id },
    _count: true,
  }).catch(() => [])
  const validCount = sellerStats
    .filter((item) => item.status === 'approved' || item.status === 'sold')
    .reduce((sum, item) => sum + item._count, 0)
  const trustBadge = validCount >= 100 ? 'Pro Seller' : validCount >= 25 ? 'Trusted Seller' : 'New Seller'
  const targetLeft = Math.max(0, 100 - validCount)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 800 }}>
        <div className="page-header" style={{ marginBottom: 30, textAlign: 'center' }}>
          <h1 className="page-title">Submit Accounts to PremiumX</h1>
          <p className="page-subtitle" style={{ maxWidth: 600, margin: '10px auto 0' }}>
            Send your stock to admin for review. Valid accounts are bought by PremiumX and the payout is added to your seller wallet.
          </p>
        </div>

        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Seller Badge</div>
            <div style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 900 }}>{trustBadge}</div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Valid Stock</div>
            <div style={{ color: 'var(--success)', fontSize: 22, fontWeight: 900 }}>{validCount}</div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Target Bonus</div>
            <div style={{ color: 'var(--info)', fontSize: 16, fontWeight: 800 }}>
              {targetLeft === 0 ? '100 valid stock target reached' : `${targetLeft} valid accounts left for Pro target`}
            </div>
          </div>
        </div>

        <SellForm categories={categories} />
      </main>
    </div>
  )
}
