'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminSidebar.module.css'

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/accounts', icon: '📦', label: 'Accounts' },
  { href: '/admin/add-account', icon: '➕', label: 'Add Account' },
  { href: '/admin/orders', icon: '🛒', label: 'Orders' },
  { href: '/admin/deposits', icon: '💳', label: 'Deposits', urgent: true },
  { href: '/admin/reports', icon: '🚩', label: 'Reports', urgent: true },
  { href: '/admin/support', icon: '🎫', label: 'Support', urgent: true },
  { href: '/admin/payments', icon: '💰', label: 'Payments' },
  { href: '/admin/withdrawals', icon: '💸', label: 'Withdrawals' },
  { href: '/admin/categories', icon: '🏷️', label: 'Categories' },
  { href: '/admin/announcements', icon: '📢', label: 'Announcements' },
  { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
]

export default function AdminSidebar({ open = false, onClose }: { open?: boolean, onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <>
    <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`} onClick={onClose} />
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          <span className={styles.logoText}>Premium</span>
          <span className={styles.logoX}>X</span>
        </Link>
        <span className={styles.adminBadge}>ADMIN</span>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
      <nav className={styles.nav}>
        {navItems.map(item => (
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
          ← Back to Site
        </Link>
      </div>
    </aside>
    </>
  )
}
