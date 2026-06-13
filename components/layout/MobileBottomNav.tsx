'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileNavProps {
  user?: { username: string; balance: number } | null
}

export default function MobileBottomNav({ user }: MobileNavProps) {
  const pathname = usePathname()

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">Home</span>
          <span>Home</span>
        </Link>

        <Link href="/browse" className={`mobile-nav-item nav-buy ${isActive('/browse') || isActive('/account') ? 'active' : ''}`}>
          <span className="nav-icon">Buy</span>
          <span>Buy</span>
        </Link>

        <Link href={user ? '/deposit' : '/login'} className={`mobile-nav-item ${isActive('/deposit') ? 'active' : ''}`}>
          <span className="nav-icon">+</span>
          <span>Add Money</span>
        </Link>

        <Link href={user ? '/orders' : '/login'} className={`mobile-nav-item ${isActive('/orders') ? 'active' : ''}`}>
          <span className="nav-icon">Bag</span>
          <span>Orders</span>
        </Link>

        <Link
          href={user ? '/dashboard' : '/login'}
          className={`mobile-nav-item ${isActive('/dashboard') || isActive('/settings') || isActive('/referral') || isActive('/login') ? 'active' : ''}`}
        >
          <span className="nav-icon">{user ? 'Me' : 'Login'}</span>
          <span>{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  )
}
