import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'
import { getAccountCollectionBatches, getNewAccountCountsByCategory } from '@/lib/accountCollections'

const statusOptions = [
  { value: 'pending', label: 'Pending only' },
  { value: 'approved', label: 'Approved only' },
  { value: 'rejected', label: 'Rejected only' },
  { value: 'sold', label: 'Sold only' },
  { value: 'all', label: 'All statuses' },
]

export default async function AccountCollectionsPage() {
  const user = await getAuthUser()
  if (!user || !(await canAccessAdminArea(user.role, 'accounts'))) redirect('/login')

  const [categories, counts, batches] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, defaultPrice: true, isActive: true } }),
    getNewAccountCountsByCategory('pending'),
    getAccountCollectionBatches(40),
  ])

  const countMap = new Map(counts.map((count) => [count.categoryId, count]))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Collection Reports</h1>
          <p className="page-subtitle">Take category-wise account reports, keep old batches, and download only new accounts when needed.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {categories.slice(0, 6).map((category) => {
          const count = countMap.get(category.id)
          return (
            <div key={category.id} className="card" style={{ padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, color: 'var(--text)' }}>{category.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending stock</div>
                </div>
                <span className={`badge badge-${category.isActive ? 'success' : 'muted'}`}>{category.isActive ? 'Active' : 'Off'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                  <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 900 }}>{count?.newCount || 0}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>New</div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                  <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 900 }}>{count?.totalCount || 0}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ padding: 22, borderRadius: 8, marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Create New Collection Report</h2>
        <form action="/api/admin/account-collections/create" method="POST" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="input" name="categoryId" required>
              <option value="__all">
                All Categories - multi-sheet Excel
              </option>
              {categories.map((category) => {
                const count = countMap.get(category.id)
                return (
                  <option key={category.id} value={category.id}>
                    {category.name} - new {count?.newCount || 0}, total {count?.totalCount || 0}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Collection Mode</label>
            <select className="input" name="mode" defaultValue="new">
              <option value="new">Only new accounts not collected before</option>
              <option value="all">All accounts including old</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status Filter</label>
            <select className="input" name="status" defaultValue="pending">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-gold" type="submit">
            Create Batch & Download
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20, borderRadius: 8, marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Preview Before Download</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
          New-only mode will skip accounts that already appeared in any previous collection batch. All Categories export creates one Excel file with separate sheets per category.
        </p>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>New Pending</th>
                <th>Total Pending</th>
                <th>Excel Sheet</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const count = countMap.get(category.id)
                return (
                  <tr key={`preview-${category.id}`}>
                    <td>{category.name}</td>
                    <td>{count?.newCount || 0}</td>
                    <td>{count?.totalCount || 0}</td>
                    <td>{category.name.slice(0, 31)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-container card mobile-hide-table">
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Category</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Accounts</th>
              <th>Date</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr><td colSpan={7} className="text-center">No collection batches yet</td></tr>
            ) : batches.map((batch) => (
              <tr key={batch.id}>
                <td className="font-mono">{batch.id.slice(0, 8)}</td>
                <td>{batch.categoryName}</td>
                <td>{batch.mode === 'new' ? 'New only' : 'All including old'}</td>
                <td>{batch.statusFilter}</td>
                <td>{batch.accountCount}</td>
                <td>{new Date(batch.createdAt).toLocaleString('en-BD')}</td>
                <td>
                  <a className="btn btn-sm btn-outline" href={`/api/admin/account-collections/${batch.id}/export`}>
                    Re-download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list">
        {batches.map((batch) => (
          <div className="mobile-data-card" key={batch.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 900 }}>{batch.categoryName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(batch.createdAt).toLocaleString('en-BD')}</div>
              </div>
              <span className="badge badge-info">{batch.accountCount} pcs</span>
            </div>
            <div className="mobile-data-row"><span className="mobile-data-label">Mode</span><span className="mobile-data-value">{batch.mode === 'new' ? 'New only' : 'All including old'}</span></div>
            <div className="mobile-data-row"><span className="mobile-data-label">Status</span><span className="mobile-data-value">{batch.statusFilter}</span></div>
            <a className="btn btn-outline w-full" style={{ marginTop: 12 }} href={`/api/admin/account-collections/${batch.id}/export`}>
              Re-download
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
