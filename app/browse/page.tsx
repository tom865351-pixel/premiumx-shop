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
              <div key={acc.id} className="card" style={{ transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } } as any}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <div className="badge" style={{ background: `${acc.category.color}20`, color: acc.category.color, border: `1px solid ${acc.category.color}40` }}>
                    {acc.category.icon} {acc.category.name}
                  </div>
                  <div className="text-gold font-mono" style={{ fontWeight: 600 }}>৳{acc.price}</div>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.title}</h3>
                <div className="flex-col gap-1" style={{ marginBottom: 16 }}>
                  <div className="text-secondary" style={{ fontSize: 13 }}>👥 {acc.followersCount?.toLocaleString() || 'N/A'} Followers</div>
                  <div className="text-secondary" style={{ fontSize: 13 }}>📅 Age: {acc.accountAge || 'Unknown'}</div>
                </div>
                <Link href={`/account/${acc.id}`} className="btn btn-outline w-full text-center">View Details</Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
