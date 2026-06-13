'use client'
import { useState, useEffect } from 'react'

const dummyEvents = [
  { user: '***99', action: 'just bought', item: 'Facebook 5K Account' },
  { user: '***12', action: 'added', item: '৳500 to Wallet' },
  { user: '***45', action: 'just bought', item: 'Instagram Premium' },
  { user: '***88', action: 'just bought', item: 'TikTok 10K Account' },
  { user: '***23', action: 'added', item: '৳1000 to Wallet' },
]

export default function LiveToast() {
  const [toast, setToast] = useState<{ user: string; action: string; item: string } | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show a toast every 10-20 seconds randomly
    const interval = setInterval(() => {
      const randomEvent = dummyEvents[Math.floor(Math.random() * dummyEvents.length)]
      setToast(randomEvent)
      setVisible(true)

      // Hide after 4 seconds
      setTimeout(() => {
        setVisible(false)
      }, 4000)
    }, Math.random() * 10000 + 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px', // Above mobile nav
      left: '20px',
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(13, 110, 253, 0.3)',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      maxWidth: 'calc(100vw - 40px)'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d6efd, #0a4fd4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
        boxShadow: '0 0 15px rgba(13,110,253,0.4)'
      }}>
        🛒
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>User {toast?.user}</span> {toast?.action}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
          {toast?.item}
        </div>
      </div>
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', color: '#64748b', 
          cursor: 'pointer', padding: '4px', marginLeft: 'auto'
        }}
      >
        ✕
      </button>
    </div>
  )
}
