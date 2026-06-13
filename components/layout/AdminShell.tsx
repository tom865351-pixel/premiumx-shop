'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import styles from '@/app/admin/AdminLayout.module.css'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`${styles.shell} admin-layout-root`}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>PremiumX Admin</span>
          <span className={styles.brandSub}>Full control panel</span>
        </div>
        <button className="btn btn-sm btn-gold" onClick={() => setOpen(true)}>
          Menu
        </button>
      </div>
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
