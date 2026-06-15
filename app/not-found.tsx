import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 520, padding: 32, textAlign: 'center' }}>
        <div className="badge badge-warning" style={{ marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>Page not found</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
          The page you are looking for does not exist, was moved, or you do not have access to it.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-gold" href="/">Go Home</Link>
          <Link className="btn btn-outline" href="/support">Contact Support</Link>
        </div>
      </div>
    </main>
  )
}
