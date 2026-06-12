'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Navbar.module.css'

interface NavUser {
  id: string
  username: string
  email: string
  role: string
  balance: number
  preferredCurrency: string
  preferredLanguage: string
}

interface NavbarProps {
  user?: NavUser | null
}

const t: Record<string, Record<string, string>> = {
  en: {
    browse: 'Browse',
    sell: 'Sell Account',
    wallet: 'Wallet',
    orders: 'My Orders',
    admin: 'Admin Panel',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    dashboard: 'Dashboard',
    balance: 'Balance',
  },
  bn: {
    browse: 'ব্রাউজ করুন',
    sell: 'অ্যাকাউন্ট বিক্রি',
    wallet: 'ওয়ালেট',
    orders: 'আমার অর্ডার',
    admin: 'অ্যাডমিন',
    login: 'লগইন',
    register: 'রেজিস্টার',
    logout: 'লগআউট',
    dashboard: 'ড্যাশবোর্ড',
    balance: 'ব্যালেন্স',
  },
}

const currencies = ['BDT', 'USD', 'USDT']

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLang] = useState(user?.preferredLanguage || 'en')
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'BDT')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const text = t[lang] || t.en

  const formatBalance = (amount?: number) => {
    const val = amount || 0
    if (currency === 'USD') return `$${(val / 110).toFixed(2)}`
    if (currency === 'USDT') return `₮${(val / 110).toFixed(2)}`
    return `৳${val.toLocaleString()}`
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleCurrencyChange = async (c: string) => {
    setCurrency(c)
    localStorage.setItem('px_currency', c)
    if (user) {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCurrency: c }),
      })
    }
    router.refresh()
  }

  const handleLangChange = async (l: string) => {
    setLang(l)
    localStorage.setItem('px_lang', l)
    if (user) {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: l }),
      })
    }
    router.refresh()
  }

  useEffect(() => {
    const savedCurrency = localStorage.getItem('px_currency')
    const savedLang = localStorage.getItem('px_lang')
    if (savedCurrency) setCurrency(savedCurrency)
    if (savedLang) setLang(savedLang)
  }, [])

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Premium</span>
          <span className={styles.logoX}>X</span>
          <span className={styles.logoShop}>Shop</span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.navLinks}>
          <Link href="/browse" className={`${styles.navLink} ${pathname === '/browse' ? styles.active : ''}`}>
            {text.browse}
          </Link>
          {user && user.role === 'seller' && (
            <Link href="/sell" className={`${styles.navLink} ${pathname === '/sell' ? styles.active : ''}`}>
              {text.sell}
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link href="/admin/dashboard" className={`${styles.navLink} ${styles.adminLink}`}>
              {text.admin}
            </Link>
          )}
        </div>

        {/* Right Controls */}
        <div className={styles.controls}>
          {/* Language Toggle */}
          <button
            className={styles.langBtn}
            onClick={() => handleLangChange(lang === 'en' ? 'bn' : 'en')}
            title={lang === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
          >
            {lang === 'en' ? '🇬🇧 EN' : '🇧🇩 বা'}
          </button>

          {/* Currency Selector */}
          <select
            className={styles.currencySelect}
            value={currency}
            onChange={e => handleCurrencyChange(e.target.value)}
          >
            {currencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {user ? (
            <>
              {/* Balance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link href="/wallet" className={styles.balanceBadge}>
                  <span className={styles.balanceIcon}>💰</span>
                  <span>{formatBalance(user.balance)}</span>
                </Link>
                <Link href="/deposit" className="btn btn-blue btn-sm" style={{ padding: '6px 12px', fontSize: 13, borderRadius: 20 }}>
                  ➕ Add Money
                </Link>
              </div>

              {/* Notifications */}
              <Link href="/notifications" className={styles.iconBtn}>
                🔔
              </Link>

              {/* User Menu */}
              <div className={styles.userMenu}>
                <button
                  className={styles.avatar}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {user.username[0].toUpperCase()}
                </button>
                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownName}>@{user.username}</span>
                      <span className={styles.dropdownEmail}>{user.email}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      📊 {text.dashboard}
                    </Link>
                    <Link href="/wallet" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      💰 {text.wallet}
                    </Link>
                    <Link href="/deposit" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)} style={{ color: 'var(--gold)', fontWeight: 600 }}>
                      💳 Add Money
                    </Link>
                    <Link href="/orders" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      📦 {text.orders}
                    </Link>
                    <Link href="/referral" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      🏆 Referral Program
                    </Link>
                    <Link href="/support" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      🎫 Support Tickets
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      ⚙️ Settings
                    </Link>
                    {(user.role === 'seller' || user.role === 'admin') && (
                      <Link href="/sell" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        📤 {text.sell}
                      </Link>
                    )}
                    {(user.role === 'admin' || user.role === 'sub-admin') && (
                      <Link href="/admin/dashboard" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        ⚙️ {text.admin}
                      </Link>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                      🚪 {text.logout}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login" className="btn btn-outline btn-sm">{text.login}</Link>
              <Link href="/register" className="btn btn-gold btn-sm">{text.register}</Link>
            </div>
          )}

          {/* Mobile Menu */}
          <button className={styles.mobileMenu} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className={styles.mobileNav}>
          <Link href="/browse" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
            {text.browse}
          </Link>
          {!user && (
            <>
              <Link href="/login" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>{text.login}</Link>
              <Link href="/register" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>{text.register}</Link>
            </>
          )}
          {user && (
            <>
              <Link href="/dashboard" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>{text.dashboard}</Link>
              <Link href="/deposit" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)} style={{ color: 'var(--blue)', fontWeight: 'bold' }}>➕ Add Money</Link>
              <Link href="/orders" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>{text.orders}</Link>
              <Link href="/wallet" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>{text.wallet}</Link>
              <button className={styles.mobileNavLink} onClick={handleLogout}>{text.logout}</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
