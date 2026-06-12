'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CategoryActions({ id, isActive }: { id: string, isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/admin/categories/${id}/toggle`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className={`btn btn-sm ${isActive ? 'btn-outline' : 'btn-gold'}`}
        style={isActive ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}
        onClick={toggle}
        disabled={loading}
      >
        {loading ? '...' : isActive ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
