'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminSidebar.module.css'

const navItems = [
  { href: '/admin/dashboard', icon: 'D', label: 'Dashboard' },
  { href: '/admin/search', icon: 'Q', label: 'Global Search' },
  { href: '/admin/activity', icon: 'Log', label: 'Activity' },
  { href: '/admin/risk', icon: 'Risk', label: 'Risk Center', urgent: true },
  { href: '/admin/users', icon: 'U', label: 'Users' },
  { href: '/admin/accounts', icon: 'A', label: 'Accounts' },
  { href: '/admin/result-batches', icon: 'RB', label: 'Result Batches' },
  { href: '/admin/add-account', icon: '+', label: 'Add Account' },
  { href: '/admin/orders', icon: 'O', label: 'Orders' },
  { href: '/admin/deposits', icon: 'BDT', label: 'Wallet Deposits', urgent: true },
  { href: '/admin/payments', icon: 'Pay', label: 'Payment Monitor' },
  { href: '/admin/notifications', icon: 'Msg', label: 'Notify Users' },
  { href: '/admin/daily-report', icon: 'Rpt', label: 'Daily Report' },
  { href: '/admin/audit', icon: 'Fix', label: 'Site Audit' },
  { href: '/admin/permissions', icon: 'Perm', label: 'Permissions' },
  { href: '/admin/withdrawals', icon: 'W', label: 'Withdrawals' },
  { href: '/admin/reports', icon: 'R', label: 'Reports', urgent: true },
  { href: '/admin/support', icon: 'S', label: 'Support', urgent: true },
  { href: '/admin/categories', icon: 'C', label: 'Categories' },
  { href: '/admin/announcements', icon: 'N', label: 'Announcements' },
  { href: '/admin/settings', icon: 'Set', label: 'Settings' },
]

export default function AdminSidebar({ open = false, onClose }: { open?: boolean, onClose?: () => void }) {
  const pathname = usePathname()
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
          <span className={styles.adminBadge}>ADMIN</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
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
