'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

export default function PurchaseButton({ accountId, price, isAvailable, isLoggedIn }: { accountId: string, price: number, isAvailable: boolean, isLoggedIn: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to purchase')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/orders')
        router.refresh()
      }, 2500)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const initiatePurchase = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setShowModal(true)
  }

  if (!isAvailable) {
    return <button className="btn btn-outline w-full" disabled>Not Available</button>
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button
        className="btn btn-gold w-full"
        onClick={initiatePurchase}
        style={{ fontSize: 16, padding: '16px' }}
      >
        Buy Now for BDT {price}
      </button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24, textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            {success ? (
              <div style={{ padding: '20px 0', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 16, color: '#10b981', fontWeight: 800 }}>OK</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#10b981' }}>Purchase Successful!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>You are being redirected to your orders to view the account details...</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Confirm Purchase</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  You are about to purchase this account for <strong className="text-gold">BDT {price}</strong>.
                </p>

                {error && <div className="alert alert-danger" style={{ marginBottom: 20, textAlign: 'left' }}>{error}</div>}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-gold"
                    onClick={handlePurchase}
                    disabled={loading}
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                  >
                    {loading ? <><Spinner size={18} /> Processing...</> : 'Confirm Payment'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => { setShowModal(false); setError(''); }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
