import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function SecurityPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')
  const logins = await prisma.loginHistory.findMany({
    where: { userId: authUser.userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 className="page-title" style={{ marginBottom: 24 }}>Change Password</h1>
        
        <form className="grid-2" style={{ gap: 24 }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Current Password</label>
            <input className="input" type="password" required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="input" type="password" required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="input" type="password" required />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <button className="btn btn-primary" type="submit">Update Password</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Login History</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Review your recent logins to ensure your account is secure.</p>
        
        {logins.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
            No login history found.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>IP Address</th>
                  <th>Browser / Device</th>
                </tr>
              </thead>
              <tbody>
                {logins.map(login => (
                  <tr key={login.id}>
                    <td>{new Date(login.createdAt).toLocaleString()}</td>
                    <td className="font-mono">{login.ip || 'Unknown IP'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{login.userAgent || 'Unknown Device'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
