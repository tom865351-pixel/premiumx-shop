'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface MobileNavProps {
  user?: { username: string; balance: number } | null
}

export default function MobileBottomNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {/* Home */}
        <Link href="/" className={`mobile-nav-item ${isActive('/') && pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </Link>

        {/* Buy Accounts */}
        <Link href="/browse" className={`mobile-nav-item nav-buy ${isActive('/browse') || isActive('/account') ? 'active' : ''}`}>
          <span className="nav-icon">🛒</span>
          <span>Buy</span>
        </Link>

        {/* Deposit / Wallet */}
        {user ? (
          <Link href="/deposit" className={`mobile-nav-item ${isActive('/deposit') ? 'active' : ''}`}>
            <span className="nav-icon">💳</span>
            <span>Add Money</span>
          </Link>
        ) : (
          <Link href="/login" className="mobile-nav-item">
            <span className="nav-icon">💳</span>
            <span>Add Money</span>
          </Link>
        )}

        {/* Orders */}
        {user ? (
          <Link href="/orders" className={`mobile-nav-item ${isActive('/orders') ? 'active' : ''}`}>
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </Link>
        ) : (
          <Link href="/login" className="mobile-nav-item">
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </Link>
        )}

        {/* Profile / Login */}
        {user ? (
          <Link href="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') || isActive('/settings') || isActive('/referral') ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </Link>
        ) : (
          <Link href="/login" className={`mobile-nav-item ${isActive('/login') ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
