'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function FloatingSupport() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const chipStyle = {
    padding: '10px 16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '14px',
    textDecoration: 'none',
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '12px'
    }}>
      <div aria-hidden={!isOpen} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        visibility: isOpen ? 'visible' : 'hidden',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right'
      }}>
        <a href="https://wa.me/8801234567890" target="_blank" rel="noreferrer" style={{
          ...chipStyle,
          background: '#25D366',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 900 }}>WA</span> WhatsApp
        </a>
        <a href="https://t.me/premiumxshop" target="_blank" rel="noreferrer" style={{
          ...chipStyle,
          background: '#0088cc',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(0, 136, 204, 0.4)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 900 }}>TG</span> Telegram
        </a>
        <Link href="/support" style={{
          ...chipStyle,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 900 }}>TKT</span> Open Ticket
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close support menu' : 'Open support menu'}
        aria-expanded={isOpen}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
          border: 'none',
          color: '#000',
          fontSize: isOpen ? 22 : 13,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)',
          cursor: 'pointer',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)'
        }}
      >
        {isOpen ? 'x' : 'Help'}
      </button>
    </div>
  )
}
