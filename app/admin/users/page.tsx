import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import UserActions from './UserActions'
import { canAccessAdminArea } from '@/lib/permissions'

export default async function AdminUsers() {
  const user = await getAuthUser()
  if (!user || !(await canAccessAdminArea(user.role, 'users'))) redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { purchases: true, listings: true } },
    },
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">View user details, edit profiles, reset passwords, and control access.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{users.length}</strong> users
          </span>
        </div>
      </div>

      <div className="mobile-card-list" style={{ marginBottom: 18 }}>
        {users.map((u) => (
          <div className="mobile-data-card" key={`mobile-${u.id}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <strong>@{u.username}</strong>
              <span className={`badge badge-${u.isBanned ? 'danger' : 'success'}`}>{u.isBanned ? 'Banned' : 'Active'}</span>
            </div>
            <div className="mobile-data-row"><span className="mobile-data-label">Email</span><span className="mobile-data-value">{u.email}</span></div>
            <div className="mobile-data-row"><span className="mobile-data-label">Phone</span><span className="mobile-data-value">{u.phone || 'N/A'}</span></div>
            <div className="mobile-data-row"><span className="mobile-data-label">Role</span><span className="mobile-data-value">{u.role}</span></div>
            <div className="mobile-data-row"><span className="mobile-data-label">Balance</span><span className="mobile-data-value text-gold">BDT {u.balance.toLocaleString()}</span></div>
            <div style={{ marginTop: 12 }}><UserActions user={u} /></div>
          </div>
        ))}
      </div>

      <div className="table-container card mobile-hide-table">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Purchases</th>
              <th>Listings</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={9} className="text-center">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.phone || 'N/A'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: u.role === 'admin' ? 'rgba(212,175,55,0.2)' : u.role === 'seller' ? 'rgba(147,51,234,0.2)' : 'rgba(255,255,255,0.1)',
                      color: u.role === 'admin' ? 'var(--gold)' : u.role === 'seller' ? 'var(--purple)' : 'var(--text-secondary)',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="font-mono text-gold">BDT {u.balance.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{u._count.purchases}</td>
                  <td style={{ textAlign: 'center' }}>{u._count.listings}</td>
                  <td>
                    <span className={`badge badge-${u.isBanned ? 'danger' : 'success'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge badge-${u.isVerified ? 'success' : 'muted'}`}>
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      {u.banReason && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, maxWidth: 160 }}>
                          {u.banReason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <UserActions user={u} />
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
