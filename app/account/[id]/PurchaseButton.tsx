'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PurchaseButton({ accountId, price, isAvailable, isLoggedIn }: { accountId: string, price: number, isAvailable: boolean, isLoggedIn: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    if (!confirm(`Are you sure you want to purchase this account for ৳${price}?`)) {
      return
    }

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

      alert('Purchase successful! You can view your account details in My Orders.')
      router.push('/orders')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!isAvailable) {
    return <button className="btn btn-outline w-full" disabled>Not Available</button>
  }

  return (
    <div style={{ marginTop: 24 }}>
      {error && <div className="text-danger" style={{ marginBottom: 12, fontSize: 14 }}>{error}</div>}
      <button 
        className="btn btn-gold w-full" 
        onClick={handlePurchase}
        disabled={loading}
      >
        {loading ? 'Processing...' : `Buy Now for ৳${price}`}
      </button>
    </div>
  )
}
