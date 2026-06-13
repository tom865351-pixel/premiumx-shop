import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function AdminNotificationComposer() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
    select: { id: true, username: true, email: true, role: true },
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Composer</h1>
          <p className="page-subtitle">Send an inbox notification to one user, all sellers, or everyone.</p>
        </div>
      </div>

      <form action="/api/admin/notifications" method="POST" className="card" style={{ padding: 22, display: 'grid', gap: 16, maxWidth: 760 }}>
        <div className="form-group">
          <label className="form-label">Audience</label>
          <select name="target" className="select" defaultValue="sellers">
            <option value="sellers">All sellers</option>
            <option value="all">All users</option>
            <option value="single">Single user</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Single User</label>
          <select name="userId" className="select" defaultValue="">
            <option value="">Select only if audience is Single user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>@{user.username} - {user.email} ({user.role})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input name="title" className="input" required placeholder="Payment update, live class, new rate..." />
        </div>

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea name="message" className="input" required rows={5} placeholder="Write notification message" />
        </div>

        <div className="form-group">
          <label className="form-label">Type</label>
          <select name="type" className="select" defaultValue="info">
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Link</label>
          <input name="link" className="input" placeholder="/wallet, /live, /support" />
        </div>

        <button className="btn btn-gold" type="submit">Send Notification</button>
      </form>
    </div>
  )
}
