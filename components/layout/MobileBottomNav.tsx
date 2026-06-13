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
          <span className="nav-icon">H</span>
          <span>Home</span>
        </Link>

        <Link href={user ? '/sell' : '/register'} className={`mobile-nav-item nav-buy ${user ? isActive('/sell') ? 'active' : '' : isActive('/register') ? 'active' : ''}`}>
          <span className="nav-icon">Sell</span>
          <span>Sell</span>
        </Link>

        <Link href={user ? '/live' : '/browse'} className={`mobile-nav-item ${user ? isActive('/live') ? 'active' : '' : isActive('/browse') ? 'active' : ''}`}>
          <span className="nav-icon">{user ? 'L' : 'Rate'}</span>
          <span>{user ? 'Live' : 'Rates'}</span>
        </Link>

        <Link href={user ? '/wallet' : '/login'} className={`mobile-nav-item ${isActive('/wallet') ? 'active' : ''}`}>
          <span className="nav-icon">BDT</span>
          <span>Wallet</span>
        </Link>

        <Link
          href={user ? '/dashboard' : '/register'}
          className={`mobile-nav-item ${isActive('/dashboard') || isActive('/orders') || isActive('/settings') || isActive('/referral') || isActive('/login') || isActive('/register') ? 'active' : ''}`}
        >
          <span className="nav-icon">{user ? 'Me' : 'Join'}</span>
          <span>{user ? 'Profile' : 'Sign Up'}</span>
        </Link>
      </div>
    </nav>
  )
}
