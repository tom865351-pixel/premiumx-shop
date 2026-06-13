import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/layout/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user || !['admin', 'sub-admin', 'stock-manager'].includes(user.role)) {
    redirect('/login')
  }

  return <AdminShell>{children}</AdminShell>
}
