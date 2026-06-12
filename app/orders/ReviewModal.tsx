'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewModal({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      
      setMsg({ type: 'success', text: 'Thank you! Your review has been submitted.' })
      setTimeout(() => { setOpen(false); router.refresh() }, 1500)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => setOpen(true)}>
        ⭐ Leave Review
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>⭐ Rate your purchase</h2>
              <button onClick={() => { setOpen(false); setMsg(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {msg && (
              <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', fontSize: 36, cursor: 'pointer', filter: rating >= star ? 'none' : 'grayscale(100%) opacity(30%)', transition: 'all 0.2s' }}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment (Optional)</label>
                <textarea className="input" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="How was the account? Fast delivery?" style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
