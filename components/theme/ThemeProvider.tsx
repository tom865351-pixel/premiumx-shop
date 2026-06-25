'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggle: () => {},
  setMode: () => {},
})

const STORAGE_KEY = 'premiumx-theme'

/**
 * Reads the saved theme (or system preference) on mount and reflects it
 * onto <html data-theme>. Default is dark to match the existing site.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved)
        document.documentElement.setAttribute('data-theme', saved)
        return
      }
      // No saved value: respect system preference, fall back to dark.
      const prefersLight =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      const initial: ThemeMode = prefersLight ? 'light' : 'dark'
      setModeState(initial)
      document.documentElement.setAttribute('data-theme', initial)
    } catch {
      /* localStorage unavailable - keep dark default */
    }
  }, [])

  const apply = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.setAttribute('data-theme', next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => {
    apply(mode === 'dark' ? 'light' : 'dark')
  }, [mode, apply])

  return (
    <ThemeContext.Provider
      value={{ mode, toggle, setMode: apply }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeMode() {
  return useContext(ThemeContext)
}
