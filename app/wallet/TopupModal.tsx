'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TopupModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bKash')
  const [transactionId, setTransactionId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod,
          transactionId
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to submit request')

      setSuccess('Topup request submitted successfully! Admin will verify soon.')
      setAmount('')
      setTransactionId('')
      
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
        router.refresh()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-gold" style={{ marginTop: 24 }} onClick={() => setIsOpen(true)}>
        Request Topup
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: 20 }}>Request Balance Topup</h2>
            
            {error && <div className="text-danger" style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="text-success" style={{ marginBottom: 16 }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Amount (৳)</label>
                <input 
                  type="number" 
                  className="input w-full" 
                  required 
                  min="50"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Payment Method</label>
                <select 
                  className="input w-full"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Binance">Binance (USDT)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Transaction ID</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  required 
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="e.g. TRX123456789"
                />
              </div>

              <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
