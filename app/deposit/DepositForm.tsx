'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

// Mapping of payment methods to phone numbers (replace with real numbers)
const METHOD_NUMBERS: Record<string, string> = {
  bkash: '01812-345678',
  nagad: '01712-345678',
  rocket: '01612-345678',
}

// Local state for selected payment method
const useMethodState = () => {
  const [selectedMethod, setMethod] = useState('')
  return { selectedMethod, setMethod }
}

export default function DepositForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ziniLoading, setZiniLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')
  // useMethodState provides selected method and setter for manual deposit
  const { selectedMethod, setMethod } = useMethodState()
  const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const body = {
      amount: parseFloat(formData.get('amount') as string),
      method: formData.get('method') as string,
      transactionId: formData.get('transactionId') as string,
    }

    if (!body.amount || body.amount < 10) {
      setMessage({ type: 'error', text: 'Minimum deposit amount is ৳10.' })
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
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleZiniPay = async () => {
    if (!amount || parseFloat(amount) < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid amount (min ৳10).' })
      return
    }

    setZiniLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/deposit/zinipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })
      const data = await res.json()

      if (!res.ok) {
        const errText = data.error || 'Failed to initiate ZiniPay'
        throw new Error(errText)
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
      setZiniLoading(false)
    }
  }

  return (
    <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div className="tabs" style={{ marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <button className={`tab ${activeTab === 'auto' ? 'active' : ''}`} onClick={() => setActiveTab('auto')}>
          ⚡ Auto Add (Instant)
        </button>
        <button className={`tab ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
          ✍️ Manual TrxID
        </button>
      </div>

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
          min="10"
          required
          placeholder="Enter amount (min ৳10)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      {activeTab === 'auto' ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center' }}>
            Pay securely via bKash, Nagad, or Rocket. Your balance will be added instantly without admin approval.
          </p>
          <button onClick={handleZiniPay} className="btn btn-blue w-full btn-lg" disabled={ziniLoading}>
            {ziniLoading ? <><Spinner size={18} /> Connecting to Gateway...</> : '⚡ Pay with ZiniPay'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select name="method" required onChange={e => setMethod(e.target.value)}>
              <option value="">Select method...</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
            </select>
            {selectedMethod && (
              <p className="form-hint" style={{ marginTop: '4px' }}>
                Send payment to: <strong>{METHOD_NUMBERS[selectedMethod]}</strong>
              </p>
            )}
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
            {loading ? <><Spinner size={18} /> Submitting...</> : '💳 Submit Manual Request'}
          </button>
        </form>
      )}
    </div>
  )
}
