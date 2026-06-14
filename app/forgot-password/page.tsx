'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setResult(null)
    const formData = new FormData(event.currentTarget)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send request')
      setResult({ type: 'success', text: data.message || 'Request sent.' })
      event.currentTarget.reset()
    } catch (err: any) {
      setResult({ type: 'danger', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', paddingTop: 32, paddingBottom: 110 }}>
      <section className="card card-glass" style={{ width: '100%', maxWidth: 520, padding: 28 }}>
        <div className="badge badge-warning" style={{ marginBottom: 16 }}>Account Recovery</div>
        <h1 className="page-title" style={{ marginBottom: 10 }}>Need password help?</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 22 }}>
          Send your account email or phone. Admin will verify and reset it from the admin panel.
        </p>

        {result && <div className={`alert alert-${result.type}`} style={{ marginBottom: 16 }}>{result.text}</div>}

        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" name="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="input" name="phone" placeholder="01700000000" />
          </div>
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea className="input" name="message" rows={4} placeholder="Tell admin anything that helps verify your account." />
          </div>
          <button className="btn btn-gold" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Request'}
          </button>
          <Link href="/login" className="btn btn-outline text-center">Back to Login</Link>
        </form>
      </section>
    </main>
  )
}
