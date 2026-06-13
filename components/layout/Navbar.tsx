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
    browse: 'Rates',
    sell: 'Sell',
    wallet: 'Wallet',
    live: 'Live',
    orders: 'Submissions',
    admin: 'Admin Panel',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    dashboard: 'Dashboard',
  },
  bn: {
    browse: 'Rates',
    sell: 'Sell',
    wallet: 'Wallet',
    live: 'Live',
    orders: 'Submissions',
    admin: 'Admin Panel',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    dashboard: 'Dashboard',
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
    if (currency === 'USDT') return `USDT ${(val / 110).toFixed(2)}`
    return `BDT ${val.toLocaleString()}`
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
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Premium</span>
          <span className={styles.logoX}>X</span>
          <span className={styles.logoShop}>Shop</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/browse" className={`${styles.navLink} ${pathname === '/browse' ? styles.active : ''}`}>
            {text.browse}
          </Link>
          {user && (
            <Link href="/sell" className={`${styles.navLink} ${pathname === '/sell' ? styles.active : ''}`}>
              {text.sell}
            </Link>
          )}
          {user && (
            <Link href="/live" className={`${styles.navLink} ${pathname === '/live' ? styles.active : ''}`}>
              {text.live}
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'sub-admin') && (
            <Link href="/admin/dashboard" className={`${styles.navLink} ${styles.adminLink}`}>
              {text.admin}
            </Link>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.langBtn}
            onClick={() => handleLangChange(lang === 'en' ? 'bn' : 'en')}
            title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            {lang === 'en' ? 'EN' : 'BN'}
          </button>

          <select
            className={styles.currencySelect}
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link href="/wallet" className={styles.balanceBadge}>
                  <span>{formatBalance(user.balance)}</span>
                </Link>
                <Link href="/wallet" className={`btn btn-blue btn-sm ${styles.addMoneyBtn}`} style={{ padding: '6px 12px', fontSize: 13, borderRadius: 20 }}>
                  Wallet
                </Link>
              </div>

              <Link href="/notifications" className={styles.iconBtn}>
                !
              </Link>

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
                      {text.dashboard}
                    </Link>
                    <Link href="/wallet" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {text.wallet}
                    </Link>
                    <Link href="/live" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      Live Sessions
                    </Link>
                    <Link href="/orders" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {text.orders}
                    </Link>
                    <Link href="/referral" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      Referral Program
                    </Link>
                    <Link href="/support" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      Support Tickets
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      Settings
                    </Link>
                    <Link href="/sell" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      Sell Account
                    </Link>
                    {user && (user.role === 'admin' || user.role === 'sub-admin') && (
                      <Link href="/admin/dashboard" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        {text.admin}
                      </Link>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                      {text.logout}
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

          <button className={styles.mobileMenu} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? 'X' : 'Menu'}
          </button>
        </div>
      </div>

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
              <Link href="/sell" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)} style={{ color: 'var(--blue)', fontWeight: 'bold' }}>Sell Account</Link>
              <Link href="/live" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Live Sessions</Link>
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
