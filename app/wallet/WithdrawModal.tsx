'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WithdrawModal({ balance }: { balance: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [form, setForm] = useState({ amount: '', method: 'bkash', accountNumber: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ type: 'success', text: 'Withdrawal request submitted! Admin will process it shortly.' })
      setForm({ amount: '', method: 'bkash', accountNumber: '' })
      setTimeout(() => { setOpen(false); router.refresh() }, 2000)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)} style={{ marginTop: 16, width: '100%' }}>
        💸 Request Withdrawal
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>💸 Request Withdrawal</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Available: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>৳{balance.toLocaleString()}</span></p>
              </div>
              <button onClick={() => { setOpen(false); setMsg(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {msg && (
              <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount (৳)</label>
                <input className="input" type="number" min="100" max={balance} value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="Minimum ৳100" required />
              </div>
              <div className="form-group">
                <label className="form-label">Withdraw Method</label>
                <select className="select" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="bkash">📱 bKash</option>
                  <option value="nagad">📱 Nagad</option>
                  <option value="crypto">🪙 Crypto (USDT TRC20)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{form.method === 'crypto' ? 'Wallet Address' : 'Account Number'}</label>
                <input className="input" value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder={form.method === 'crypto' ? 'TXXXXXXXXXXX...' : '01XXXXXXXXX'}
                  required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Submitting...' : '✅ Submit Request'}
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
