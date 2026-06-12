'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnnouncementForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all'
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed to create')
      setForm({ title: '', message: '', type: 'info', target: 'all' })
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Create Broadcast</h2>
      
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Server Maintenance" />
      </div>

      <div className="form-group">
        <label className="form-label">Message</label>
        <textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Detailed message..." />
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Type (Color)</label>
          <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="info">🟦 Info (Blue)</option>
            <option value="success">🟩 Success (Green)</option>
            <option value="warning">🟨 Warning (Yellow)</option>
            <option value="danger">🟥 Danger (Red)</option>
            <option value="gold">🟨 Premium (Gold)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Target Audience</label>
          <select className="select" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
            <option value="all">Everyone</option>
            <option value="buyers">Buyers Only</option>
            <option value="sellers">Sellers & Admins</option>
          </select>
        </div>
      </div>

      <button className="btn btn-gold w-full" type="submit" disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Creating...' : 'Broadcast Now 📢'}
      </button>
    </form>
  )
}
