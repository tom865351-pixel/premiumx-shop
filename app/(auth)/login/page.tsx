'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const identifier = formData.get('identifier')
    const password = formData.get('password')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card card-glass" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>Premium</span>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 800, color: 'var(--purple)' }}>X</span>
          </Link>
          <h1 style={{ fontSize: 20, marginTop: 16 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Username, Email or Phone</label>
            <input type="text" name="identifier" required placeholder="username, name@example.com or 01700000000" autoComplete="username" />
          </div>
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label className="form-label">Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--gold)' }}>Forgot?</Link>
            </div>
            <input type="password" name="password" required placeholder="Enter password" />
          </div>

          <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          <a href="/api/auth/google" className="btn btn-outline w-full">
            Continue with Google
          </a>
          <a href="/api/auth/facebook" className="btn btn-outline w-full">
            Continue with Facebook
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account? <Link href="/register" className="text-gold">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
