'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/support/${data.ticketId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 700 }}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => router.back()} className="btn btn-sm btn-outline">← Back</button>
        </div>
        <h1 className="page-title" style={{ marginBottom: 8 }}>🎫 Create Support Ticket</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Describe your issue and we&apos;ll get back to you shortly.</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. I cannot login to my purchased account" required />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">🟢 Low — General questions</option>
              <option value="normal">🔵 Normal — Account issues</option>
              <option value="high">🟡 High — Payment problems</option>
              <option value="urgent">🔴 Urgent — Account lost/hacked</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Describe your issue *</label>
            <textarea className="input" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Please describe your issue in detail..." required rows={6}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <button className="btn btn-gold" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : '📩 Submit Ticket'}
          </button>
        </form>
      </main>
    </div>
  )
}
