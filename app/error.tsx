'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 520, padding: 32, textAlign: 'center' }}>
        <div className="badge badge-danger" style={{ marginBottom: 16 }}>Something went wrong</div>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>PremiumX hit a problem</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
          The page could not load properly. Try again, or go back to the homepage.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" type="button" onClick={() => reset()}>Try Again</button>
          <a className="btn btn-outline" href="/">Go Home</a>
        </div>
      </div>
    </main>
  )
}
