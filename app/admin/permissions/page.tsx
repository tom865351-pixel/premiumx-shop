import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'

export default async function PermissionsPage() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const permissions = await getSetting('subadmin_permissions')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sub-admin Permission Control</h1>
          <p className="page-subtitle">Control which admin areas sub-admins should access. Save the JSON map in settings.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 18 }}>
        <form action="/api/admin/settings" method="POST" className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Permission Map</h2>
          <textarea className="input" name="subadmin_permissions" defaultValue={permissions} rows={10} />
          <button className="btn btn-gold" type="submit" style={{ marginTop: 14 }}>Save Permissions</button>
        </form>

        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Recommended Keys</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {['users', 'accounts', 'payouts', 'support', 'settings', 'risk', 'payments'].map((key) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <strong>{key}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>true / false</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
