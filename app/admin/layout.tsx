import AdminSidebar from '@/components/layout/AdminSidebar'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user || !['admin', 'sub-admin', 'stock-manager'].includes(user.role)) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '32px 40px', background: 'var(--bg)', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
