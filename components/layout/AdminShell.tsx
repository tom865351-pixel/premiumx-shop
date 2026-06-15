'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import styles from '@/app/admin/AdminLayout.module.css'
import type { StaffPermissionKey } from '@/lib/permissions'

export default function AdminShell({
  children,
  role,
  permissions,
}: {
  children: React.ReactNode
  role: string
  permissions: Record<StaffPermissionKey, boolean>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`${styles.shell} admin-layout-root`}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>PremiumX {role === 'admin' ? 'Admin' : role === 'stock-manager' ? 'Stock Manager' : 'Sub Admin'}</span>
          <span className={styles.brandSub}>{role === 'admin' ? 'Full premium control panel' : 'Permission based staff panel'}</span>
        </div>
        <button type="button" className="btn btn-sm btn-gold" onClick={() => setOpen(true)}>
          Menu
        </button>
      </div>
      <AdminSidebar open={open} onClose={() => setOpen(false)} role={role} permissions={permissions} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
