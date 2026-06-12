'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Register() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const username = formData.get('username')
    const password = formData.get('password')
    const confirm = formData.get('confirm')

    if (password !== confirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      
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
          <h1 style={{ fontSize: 20, marginTop: 16 }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Join the trusted marketplace</p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only" placeholder="john_doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" required placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" required minLength={6} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirm" required minLength={6} placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account? <Link href="/login" className="text-gold">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
