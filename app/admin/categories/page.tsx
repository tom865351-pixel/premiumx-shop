import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminCategories() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { accounts: true } } }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Categories</h1>
          <p className="page-subtitle">Configure platforms and their default selling prices.</p>
        </div>
        <button className="btn btn-gold">Add Category</button>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Platform Name</th>
              <th>Default Price</th>
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
                  <td style={{ fontSize: 24 }}>{cat.icon}</td>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td className="font-mono text-gold">৳{cat.defaultPrice}</td>
                  <td>{cat.isActive ? cat._count.accounts : 0}</td>
                  <td>
                    <span className={`badge badge-${cat.isActive ? 'success' : 'danger'}`}>
                      {cat.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-outline">Edit</button>
                      <button className={`btn btn-sm ${cat.isActive ? 'btn-outline' : 'btn-gold'}`} style={cat.isActive ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}>
                        {cat.isActive ? 'Disable' : 'Enable'}
                      </button>
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
