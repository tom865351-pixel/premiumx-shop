'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

const methods = [
  { value: 'bkash', label: 'bKash', hint: '01XXXXXXXXX' },
  { value: 'nagad', label: 'Nagad', hint: '01XXXXXXXXX' },
  { value: 'rocket', label: 'Rocket', hint: '01XXXXXXXXX' },
  { value: 'crypto', label: 'USDT TRC20', hint: 'TXXXXXXXXXXX...' },
  { value: 'bank', label: 'Bank Transfer', hint: 'Account number / IBAN' },
]

export default function WithdrawModal({ balance }: { balance: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [form, setForm] = useState({ amount: '', method: 'bkash', accountNumber: '' })
  const selectedMethod = methods.find((method) => method.value === form.method) || methods[0]
  const amount = Number.parseFloat(form.amount || '0')
  const remaining = Number.isFinite(amount) ? Math.max(balance - amount, 0) : balance

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
      if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal')
      setMsg({ type: 'success', text: 'Withdrawal submitted. Amount is now reserved until admin pays or rejects it.' })
      setForm({ amount: '', method: 'bkash', accountNumber: '' })
      setTimeout(() => { setOpen(false); router.refresh() }, 1500)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)} style={{ marginTop: 12, width: '100%' }}>
        Request Withdrawal
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 24, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Request Withdrawal</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Available: <span style={{ color: 'var(--gold)', fontWeight: 800 }}>BDT {balance.toLocaleString()}</span>
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); setMsg(null) }}
                aria-label="Close withdrawal modal"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', width: 36, height: 36, cursor: 'pointer' }}
              >
                X
              </button>
            </div>

            {msg && (
              <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount (BDT)</label>
                <input
                  className="input"
                  type="number"
                  min="100"
                  max={balance}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Minimum BDT 100"
                  required
                />
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Balance after request: BDT {remaining.toLocaleString()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Withdraw Method</label>
                <select className="select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {methods.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{form.method === 'crypto' ? 'Wallet Address' : 'Account Number'}</label>
                <input
                  className="input"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder={selectedMethod.hint}
                  required
                />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
                The amount is reserved instantly. Admin will pay and approve it. If rejected or cancelled, the amount returns to your wallet.
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" type="submit" disabled={loading || balance < 100} style={{ flex: '1 1 180px' }}>
                  {loading ? <><Spinner size={18} /> Submitting...</> : 'Submit Request'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} style={{ flex: '1 1 120px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
