import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <main className="container" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', paddingTop: 32, paddingBottom: 110 }}>
      <section className="card card-glass" style={{ width: '100%', maxWidth: 520, padding: 28, textAlign: 'center' }}>
        <div className="badge badge-warning" style={{ marginBottom: 16 }}>Account Recovery</div>
        <h1 className="page-title" style={{ marginBottom: 10 }}>Need password help?</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 22 }}>
          For safety, password reset is handled by admin support. Send your username, email, and phone number so admin can verify and reset your account.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/support/new" className="btn btn-gold">Open Support Ticket</Link>
          <Link href="/login" className="btn btn-outline">Back to Login</Link>
        </div>
      </section>
    </main>
  )
}
