'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

interface PaymentMethod {
  value: string
  label: string
  number: string
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { value: 'bkash', label: 'bKash', number: '01XXXXXXXXX' },
  { value: 'nagad', label: 'Nagad', number: '01XXXXXXXXX' },
  { value: 'rocket', label: 'Rocket', number: '01XXXXXXXXX' },
]

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default function DepositForm({ methods = DEFAULT_METHODS, minAmount = 50 }: { methods?: PaymentMethod[]; minAmount?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ziniLoading, setZiniLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedMethod, setMethod] = useState(methods[0]?.value || 'bkash')
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')
  const selectedMethodData = methods.find((method) => method.value === selectedMethod) || methods[0] || DEFAULT_METHODS[0]
  const quickAmounts = Array.from(new Set([minAmount, ...QUICK_AMOUNTS])).filter((value) => value >= minAmount)

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const body = {
      amount: Number.parseFloat(String(formData.get('amount') || '0')),
      method: String(formData.get('method') || ''),
      transactionId: String(formData.get('transactionId') || '').trim(),
    }

    if (!body.amount || body.amount < minAmount) {
      setMessage({ type: 'error', text: `Minimum add money amount is BDT ${minAmount}.` })
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
      setMessage({ type: 'success', text: 'Add money request submitted. Admin will verify it soon.' })
      setAmount('')
      ;(e.target as HTMLFormElement).reset()
      setMethod('bkash')
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleZiniPay = async () => {
    if (!amount || Number.parseFloat(amount) < minAmount) {
      setMessage({ type: 'error', text: `Please enter a valid amount, minimum BDT ${minAmount}.` })
      return
    }

    setZiniLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/deposit/zinipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number.parseFloat(amount) }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment')

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Payment URL missing')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
      setZiniLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="tabs" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
        <button type="button" className={`tab ${activeTab === 'auto' ? 'active' : ''}`} onClick={() => setActiveTab('auto')}>
          Auto Payment
        </button>
        <button type="button" className={`tab ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
          Manual TrxID
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Quick Amount</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              className={`btn btn-sm ${amount === String(quickAmount) ? 'btn-blue' : 'btn-outline'}`}
              onClick={() => setAmount(String(quickAmount))}
            >
              BDT {quickAmount}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Amount (BDT)</label>
        <input
          type="number"
          name="amount"
          required
          min={minAmount}
          placeholder={`Enter amount, minimum BDT ${minAmount}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {activeTab === 'auto' ? (
        <div style={{ marginTop: 4 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            Pay automatically with ZiniPay. Successful payments are added to your wallet after gateway confirmation.
          </p>
          <button type="button" onClick={handleZiniPay} className="btn btn-blue w-full btn-lg" disabled={ziniLoading}>
            {ziniLoading ? <><Spinner size={18} /> Connecting...</> : 'Pay with ZiniPay'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select name="method" required value={selectedMethod} onChange={(e) => setMethod(e.target.value)}>
              {methods.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
            <p className="form-hint" style={{ marginTop: 4 }}>
              Send payment to: <strong>{selectedMethodData.number}</strong>
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <input
              type="text"
              name="transactionId"
              required
              placeholder="e.g. 8GH3K2A91B"
              style={{ fontFamily: 'JetBrains Mono' }}
            />
            <div className="form-hint">Send money first, then submit the exact TrxID from your payment SMS.</div>
          </div>

          <button type="submit" className="btn btn-gold w-full btn-lg" disabled={loading}>
            {loading ? <><Spinner size={18} /> Submitting...</> : 'Submit Add Money Request'}
          </button>
        </form>
      )}
    </div>
  )
}
