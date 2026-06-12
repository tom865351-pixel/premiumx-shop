import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '32px 40px', background: 'var(--bg)', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
