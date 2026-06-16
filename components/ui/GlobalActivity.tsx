'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const MIN_VISIBLE_MS = 450
const SLOW_REQUEST_MS = 650
const SLOW_NAV_MS = 420
const MAX_LINK_WAIT_MS = 6000

function isPlainLeftClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

export default function GlobalActivity() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [compact, setCompact] = useState(true)
  const [label, setLabel] = useState('Working...')
  const startedAt = useRef(0)
  const pendingRequests = useRef(0)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current)
    if (endTimer.current) clearTimeout(endTimer.current)
    showTimer.current = null
    endTimer.current = null
  }

  const begin = (nextLabel = 'Working...', nextCompact = true) => {
    setLabel(nextLabel)
    setCompact(nextCompact)
    startedAt.current = Date.now()
    setActive(true)
  }

  const end = () => {
    const elapsed = Date.now() - startedAt.current
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
    window.setTimeout(() => {
      if (pendingRequests.current <= 0) setActive(false)
    }, wait)
  }

  useEffect(() => {
    clearTimers()
    end()
  }, [pathname])

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (...args) => {
      let shown = false
      const requestDelayTimer = setTimeout(() => {
        shown = true
        pendingRequests.current += 1
        begin('Working...', true)
      }, SLOW_REQUEST_MS)

      try {
        return await originalFetch(...args)
      } finally {
        clearTimeout(requestDelayTimer)
        if (shown) {
          pendingRequests.current = Math.max(0, pendingRequests.current - 1)
          end()
        }
      }
    }

    const onClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event) || event.defaultPrevented) return
      const target = event.target as Element | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      clearTimers()
      showTimer.current = setTimeout(() => begin('Loading...', true), SLOW_NAV_MS)
      endTimer.current = setTimeout(end, MAX_LINK_WAIT_MS)
    }

    const onSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented) return
      clearTimers()
      showTimer.current = setTimeout(() => begin('Submitting...', false), SLOW_NAV_MS)
      endTimer.current = setTimeout(end, MAX_LINK_WAIT_MS)
    }

    window.addEventListener('click', onClick, true)
    window.addEventListener('submit', onSubmit, true)

    return () => {
      window.fetch = originalFetch
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('submit', onSubmit, true)
      clearTimers()
    }
  }, [])

  return (
    <div className={`global-activity ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`} aria-live="polite" aria-hidden={!active}>
      <div className="global-activity-bar" />
      <div className="global-activity-pill">
        <span className="global-activity-dot" />
        <span>{label}</span>
      </div>
    </div>
  )
}
