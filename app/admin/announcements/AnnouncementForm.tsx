'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const presets = [
  {
    label: 'Instagram Opening Class',
    title: 'Instagram Account Opening Live Class',
    message: 'We will show account opening steps, required setup, common problems, and how to submit accounts correctly.',
    type: 'gold',
    target: 'sellers',
  },
  {
    label: 'Seller Training',
    title: 'Seller Training Session',
    message: 'Learn which accounts PremiumX accepts, how review works, and how payouts are processed.',
    type: 'info',
    target: 'sellers',
  },
  {
    label: 'Support Live',
    title: 'Live Support Session',
    message: 'Join this session for wallet, withdrawal, submission, and account approval help.',
    type: 'success',
    target: 'all',
  },
]

export default function AnnouncementForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    link: '',
    scheduledAt: '',
    expiresAt: '',
  })

  const applyPreset = (index: string) => {
    const preset = presets[Number(index)]
    if (!preset) return
    setForm((current) => ({
      ...current,
      title: preset.title,
      message: preset.message,
      type: preset.type,
      target: preset.target,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setForm({ title: '', message: '', type: 'info', target: 'all', link: '', scheduledAt: '', expiresAt: '' })
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24, borderRadius: 8 }}>
      <h2 style={{ fontSize: 18, marginBottom: 6 }}>Create Live Notice</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
        Use this for live classes, support sessions, meeting links, and important wallet or seller notices.
      </p>

      <div className="form-group">
        <label className="form-label">Quick Template</label>
        <select className="select" defaultValue="" onChange={(e) => applyPreset(e.target.value)}>
          <option value="">Start from blank...</option>
          {presets.map((preset, index) => (
            <option key={preset.label} value={index}>{preset.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Instagram Account Opening Live Class" />
      </div>

      <div className="form-group">
        <label className="form-label">What will be shown?</label>
        <textarea className="input" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder="Write the class topics, rules, what users should prepare, and any important notes." />
      </div>

      <div className="form-group">
        <label className="form-label">Meet / Join Link</label>
        <input className="input" type="url" value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/..." />
        <span className="form-hint">Users can join directly from the banner or Live page.</span>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Start Time</label>
          <input className="input" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Hide After</label>
          <input className="input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Notice Style</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
            <option value="gold">Premium Gold</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Audience</label>
          <select className="select" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            <option value="all">Everyone</option>
            <option value="buyers">Buyers Only</option>
            <option value="sellers">Sellers & Admins</option>
          </select>
        </div>
      </div>

      <button className="btn btn-gold w-full" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Creating...' : 'Publish Notice'}
      </button>
    </form>
  )
}
