import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminAccounts() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, seller: true }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Accounts</h1>
          <p className="page-subtitle">Approve, reject, or delete submitted accounts.</p>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>ID / Title</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center">No accounts found</td></tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{acc.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {acc.id.slice(-6)}</div>
                  </td>
                  <td>{acc.category.icon} {acc.category.name}</td>
                  <td>@{acc.seller.username}</td>
                  <td className="font-mono text-gold">৳{acc.price}</td>
                  <td>
                    <span className={`badge badge-${
                      acc.status === 'approved' ? 'success' : 
                      acc.status === 'pending' ? 'warning' : 'danger'
                    }`}>
                      {acc.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-outline">Edit</button>
                      {acc.status === 'pending' && (
                        <button className="btn btn-sm btn-gold">Approve</button>
                      )}
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
