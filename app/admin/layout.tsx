import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/layout/AdminShell'
import { getPermissionsForRole } from '@/lib/permissions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user || !['admin', 'sub-admin', 'stock-manager'].includes(user.role)) {
    redirect('/login')
  }

  const permissions = await getPermissionsForRole(user.role)

  return <AdminShell role={user.role} permissions={permissions}>{children}</AdminShell>
}
