'use client'
import { useState } from 'react'
import Spinner from '@/components/ui/Spinner'

export default function DepositForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [amount, setAmount] = useState('')

  const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const body = {
      amount: parseFloat(formData.get('amount') as string),
      method: formData.get('method') as string,
      transactionId: formData.get('transactionId') as string,
    }

    if (!body.amount || body.amount < 50) {
      setMessage({ type: 'error', text: 'Minimum deposit amount is ৳50.' })
      setLoading(false)
      return
    }
    if (!body.transactionId.trim()) {
      setMessage({ type: 'error', text: 'Transaction ID is required.' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setMessage({ type: 'success', text: '✅ Deposit request submitted! Admin will approve within a few minutes.' })
      setAmount('')
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Quick Amount (৳)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              type="button"
              className={`btn btn-sm ${amount === String(a) ? 'btn-blue' : 'btn-outline'}`}
              onClick={() => setAmount(String(a))}
            >
              ৳{a}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Amount (৳) *</label>
        <input
          type="number"
          name="amount"
          min="50"
          required
          placeholder="Enter amount (min ৳50)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Payment Method *</label>
        <select name="method" required>
          <option value="">Select method...</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="rocket">Rocket</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Transaction ID *</label>
        <input
          type="text"
          name="transactionId"
          required
          placeholder="e.g. 8GH3K2A91B"
          style={{ fontFamily: 'JetBrains Mono' }}
        />
        <div className="form-hint">Copy the TrxID from your payment confirmation SMS.</div>
      </div>

      <button type="submit" className="btn btn-gold w-full btn-lg" disabled={loading}>
        {loading ? <><Spinner size={18} /> Submitting...</> : '💳 Submit Deposit Request'}
      </button>
    </form>
  )
}
