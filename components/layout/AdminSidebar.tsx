'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminSidebar.module.css'
import type { StaffPermissionKey } from '@/lib/permissions'

const navItems = [
  { href: '/admin/dashboard', icon: 'D', label: 'Dashboard', permission: 'dashboard' },
  { href: '/admin/search', icon: 'S', label: 'Global Search', permission: 'search' },
  { href: '/admin/activity', icon: 'A', label: 'Activity', permission: 'activity' },
  { href: '/admin/risk', icon: '!', label: 'Risk Center', permission: 'risk', urgent: true },
  { href: '/admin/users', icon: 'U', label: 'Users', permission: 'users' },
  { href: '/admin/accounts', icon: '#', label: 'Accounts', permission: 'accounts' },
  { href: '/admin/account-collections', icon: 'XL', label: 'Collection Reports', permission: 'accounts' },
  { href: '/admin/result-batches', icon: 'R', label: 'Upload Result', permission: 'results' },
  { href: '/admin/add-account', icon: '+', label: 'Add Account', permission: 'addAccount' },
  { href: '/admin/orders', icon: 'O', label: 'Orders', permission: 'orders' },
  { href: '/admin/deposits', icon: 'BDT', label: 'Wallet Deposits', permission: 'deposits', urgent: true },
  { href: '/admin/payments', icon: 'P', label: 'Payment Monitor', permission: 'payments' },
  { href: '/admin/notifications', icon: 'N', label: 'Notify Users', permission: 'notifications' },
  { href: '/admin/daily-report', icon: 'DR', label: 'Daily Report', permission: 'dailyReport' },
  { href: '/admin/audit', icon: 'QA', label: 'Site Audit', permission: 'audit' },
  { href: '/admin/permissions', icon: 'AC', label: 'Permissions', permission: 'permissions' },
  { href: '/admin/withdrawals', icon: 'W', label: 'Withdrawals', permission: 'withdrawals' },
  { href: '/admin/reports', icon: 'RP', label: 'Reports', permission: 'reports', urgent: true },
  { href: '/admin/support', icon: '?', label: 'Support', permission: 'support', urgent: true },
  { href: '/admin/categories', icon: 'C', label: 'Categories', permission: 'categories' },
  { href: '/admin/announcements', icon: 'AN', label: 'Announcements', permission: 'announcements' },
  { href: '/admin/settings', icon: 'ST', label: 'Settings', permission: 'settings' },
] satisfies Array<{ href: string; icon: string; label: string; permission: StaffPermissionKey; urgent?: boolean }>

export default function AdminSidebar({
  open = false,
  onClose,
  role,
  permissions,
}: {
  open?: boolean
  onClose?: () => void
  role: string
  permissions: Record<StaffPermissionKey, boolean>
}) {
  const pathname = usePathname()
  const visibleItems = navItems.filter((item) => permissions[item.permission])

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`} onClick={onClose} />
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoMark}>PX</span>
            <span className={styles.logoWords}>
              <span>
                <span className={styles.logoText}>Premium</span>
                <span className={styles.logoX}>X</span>
              </span>
              <span className={styles.logoShop}>Shop</span>
            </span>
          </Link>
          <span className={styles.adminBadge}>{role === 'admin' ? 'ADMIN' : role === 'stock-manager' ? 'STOCK' : 'SUB'}</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
        <nav className={styles.nav}>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              onClick={onClose}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.urgent && <span className={styles.urgentDot} />}
            </Link>
          ))}
        </nav>
        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  )
}
