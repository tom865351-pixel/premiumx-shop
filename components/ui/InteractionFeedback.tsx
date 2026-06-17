'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type Feedback = {
  active: boolean
  slow: boolean
  label: string
}

const CLICK_SELECTOR = 'a[href], button, [role="button"], input[type="submit"], input[type="button"]'

export default function InteractionFeedback() {
  const pathname = usePathname()
  const [feedback, setFeedback] = useState<Feedback>({ active: false, slow: false, label: 'Working...' })
  const clearTimer = useRef<number | null>(null)
  const slowTimer = useRef<number | null>(null)

  useEffect(() => {
    setFeedback({ active: false, slow: false, label: 'Working...' })
    window.document.body.classList.remove('is-interacting')
  }, [pathname])

  useEffect(() => {
    const clearTimers = () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current)
      if (slowTimer.current) window.clearTimeout(slowTimer.current)
    }

    const finishSoon = (delay = 900) => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current)
      clearTimer.current = window.setTimeout(() => {
        setFeedback({ active: false, slow: false, label: 'Working...' })
        window.document.body.classList.remove('is-interacting')
      }, delay)
    }

    const start = (label: string, longEnoughForSlowHint: boolean) => {
      clearTimers()
      window.document.body.classList.add('is-interacting')
      setFeedback({ active: true, slow: false, label })

      if (longEnoughForSlowHint) {
        slowTimer.current = window.setTimeout(() => {
          setFeedback({ active: true, slow: true, label: 'Still working...' })
        }, 850)
        finishSoon(5000)
      } else {
        finishSoon(700)
      }
    }

    const markPressed = (el: Element) => {
      el.classList.add('tap-ack')
      window.setTimeout(() => el.classList.remove('tap-ack'), 360)
    }

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(CLICK_SELECTOR)
      if (!target || !(target instanceof HTMLElement)) return

      const disabled =
        target.hasAttribute('disabled') ||
        target.getAttribute('aria-disabled') === 'true' ||
        target.closest('[aria-disabled="true"]')
      if (disabled) return

      markPressed(target)

      const link = target.closest('a[href]') as HTMLAnchorElement | null
      if (link) {
        const href = link.getAttribute('href') || ''
        const isExternal = link.target === '_blank' || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
        const isSameHash = href.startsWith('#')
        if (!isExternal && !isSameHash) start('Opening...', true)
        return
      }

      const button = target.closest('button, [role="button"], input[type="submit"], input[type="button"]')
      if (button) start('Tap received', false)
    }

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      start('Submitting...', true)

      const submitter = event.submitter
      if (submitter instanceof HTMLElement) markPressed(submitter)
    }

    window.document.addEventListener('click', handleClick, true)
    window.document.addEventListener('submit', handleSubmit, true)

    return () => {
      clearTimers()
      window.document.removeEventListener('click', handleClick, true)
      window.document.removeEventListener('submit', handleSubmit, true)
      window.document.body.classList.remove('is-interacting')
    }
  }, [])

  return (
    <div className={`interaction-feedback ${feedback.active ? 'show' : ''} ${feedback.slow ? 'slow' : ''}`} aria-live="polite">
      <span className="interaction-feedback-dot" />
      <span>{feedback.label}</span>
    </div>
  )
}
