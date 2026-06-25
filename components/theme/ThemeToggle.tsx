'use client'

import { useThemeMode } from './ThemeProvider'

/**
 * Compact theme toggle. Shows sun in dark mode (switch to light)
 * and moon in light mode (switch to dark).
 */
export default function ThemeToggle({
  variant = 'icon',
}: {
  variant?: 'icon' | 'navbar'
}) {
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={variant === 'navbar' ? 'theme-toggle navbar-toggle' : 'theme-toggle'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" data-active={isDark ? 'dark' : 'light'}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  )
}
