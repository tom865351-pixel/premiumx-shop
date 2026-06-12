import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function Browse({
  searchParams,
}: {
  searchParams: { category?: string, q?: string, min?: string, max?: string }
}) {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null
  
  const where: any = {
    status: 'approved',
    ...(searchParams.category ? { categoryId: searchParams.category } : {}),
    ...(searchParams.q ? { title: { contains: searchParams.q } } : {}),
  }

  if (searchParams.min || searchParams.max) {
    where.price = {}
    if (searchParams.min) where.price.gte = parseFloat(searchParams.min)
    if (searchParams.max) where.price.lte = parseFloat(searchParams.max)
  }

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
  ])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1 }}>
        <div className="page-header" style={{ alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Browse Accounts</h1>
            <p className="page-subtitle">Find the perfect digital account for your needs.</p>
          </div>
          
          <form style={{ display: 'flex', gap: 12 }} action="/browse">
            {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input name="q" className="input" placeholder="Search accounts..." defaultValue={searchParams.q} style={{ width: 250 }} />
            </div>
            <input name="min" className="input" placeholder="Min ৳" type="number" defaultValue={searchParams.min} style={{ width: 90 }} />
            <input name="max" className="input" placeholder="Max ৳" type="number" defaultValue={searchParams.max} style={{ width: 90 }} />
            <button type="submit" className="btn btn-gold">Filter</button>
            {(searchParams.q || searchParams.min || searchParams.max) && (
              <Link href={`/browse${searchParams.category ? '?category=' + searchParams.category : ''}`} className="btn btn-outline">Clear</Link>
            )}
          </form>
        </div>

        <div className="tabs">
          <Link href="/browse" className={`tab ${!searchParams.category ? 'active' : ''}`}>
            All
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              href={`/browse?category=${cat.id}${searchParams.q ? '&q=' + searchParams.q : ''}`} 
              className={`tab ${searchParams.category === cat.id ? 'active' : ''}`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>

        {accounts.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No accounts found</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Try adjusting your filters or selecting a different category.</p>
          </div>
        ) : (
          <div className="grid-4">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                className="card" 
                style={{ 
                  transition: 'all 0.3s ease', 
                  border: '1px solid rgba(14, 165, 233, 0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  ':hover': { 
                    transform: 'translateY(-6px)',
                    border: '1px solid rgba(14, 165, 233, 0.5)',
                    boxShadow: '0 8px 30px rgba(14, 165, 233, 0.15)',
                  } 
                } as any}
              >
                {/* Glow Effect Background */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                  zIndex: 0
                }} className="card-glow" />

                <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <div className="badge" style={{ 
                      background: `${acc.category.color}15`, 
                      color: acc.category.color, 
                      border: `1px solid ${acc.category.color}40`,
                      backdropFilter: 'blur(10px)',
                      fontWeight: 600
                    }}>
                      {acc.category.icon} {acc.category.name}
                    </div>
                    <div className="text-gold font-mono" style={{ fontWeight: 800, fontSize: 18, textShadow: '0 0 10px rgba(234, 179, 8, 0.2)' }}>৳{acc.price}</div>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: 17, 
                    marginBottom: 12, 
                    fontWeight: 700,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{acc.title}</h3>
                  
                  <div className="flex-col gap-2" style={{ marginBottom: 20, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>👥 {acc.followersCount?.toLocaleString() || 'N/A'} Followers</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>📅 Age: {acc.accountAge || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/account/${acc.id}`} 
                    className="btn w-full text-center" 
                    style={{ 
                      background: 'linear-gradient(to right, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.2))',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      color: '#38bdf8',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
