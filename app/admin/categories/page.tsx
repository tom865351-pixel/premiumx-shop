import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AddCategoryModal from './AddCategoryModal'
import CategoryActions from './CategoryActions'
import EditCategoryModal from './EditCategoryModal'
import CategoryLogo from '@/components/ui/CategoryLogo'

export default async function AdminCategories() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { accounts: { where: { status: 'approved' } } } } },
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Pricing Manager</h1>
          <p className="page-subtitle">Configure platforms, default buying rates, active status, and seller price calculator values.</p>
        </div>
        <AddCategoryModal />
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Mark</th>
              <th>Platform Name</th>
              <th>Buying Rate</th>
              <th>Active Accounts</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={6} className="text-center">No categories found</td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id}>
                  <td><CategoryLogo icon={cat.icon} name={cat.name} color={cat.color} size={38} radius={8} /></td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{cat.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{cat.description || 'No description'}</div>
                  </td>
                  <td>
                    <div className="font-mono text-gold">BDT {cat.defaultPrice.toLocaleString()}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>10 pcs: BDT {(cat.defaultPrice * 10).toLocaleString()}</div>
                  </td>
                  <td>{cat._count.accounts}</td>
                  <td>
                    <span className={`badge badge-${cat.isActive ? 'success' : 'danger'}`}>
                      {cat.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <EditCategoryModal category={cat} />
                      <CategoryActions id={cat.id} isActive={cat.isActive} category={cat} />
                    </div>
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
