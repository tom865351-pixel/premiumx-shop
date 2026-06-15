import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'
import { STAFF_PERMISSION_KEYS, STAFF_PERMISSION_LABELS } from '@/lib/permissions'

function parse(value: string) {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' ? parsed as Record<string, boolean> : {}
  } catch {
    return {}
  }
}

export default async function PermissionsPage() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const subAdminPermissions = parse(await getSetting('subadmin_permissions'))
  const stockManagerPermissions = parse(await getSetting('stockmanager_permissions'))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Permission Control</h1>
          <p className="page-subtitle">Give sub admins and stock managers exact access from the website.</p>
        </div>
      </div>

      <form action="/api/admin/settings" method="POST" className="card" style={{ padding: 22 }}>
        <input type="hidden" name="permissions_form" value="1" />
        <div className="grid-2" style={{ gap: 18 }}>
          <PermissionColumn title="Sub Admin Access" prefix="subadmin" values={subAdminPermissions} />
          <PermissionColumn title="Stock Manager Access" prefix="stockmanager" values={stockManagerPermissions} />
        </div>
        <button className="btn btn-gold" type="submit" style={{ marginTop: 18 }}>Save Staff Permissions</button>
      </form>
    </div>
  )
}

function PermissionColumn({ title, prefix, values }: { title: string; prefix: string; values: Record<string, boolean> }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 14 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {STAFF_PERMISSION_KEYS.map((key) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
            <span>
              <strong>{STAFF_PERMISSION_LABELS[key]}</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11 }}>{key}</span>
            </span>
            <input type="checkbox" name={`${prefix}_${key}`} defaultChecked={values[key] === true} />
          </label>
        ))}
      </div>
    </div>
  )
}
