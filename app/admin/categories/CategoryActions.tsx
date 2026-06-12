'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

export default function CategoryActions({ id, isActive, category }: { id: string, isActive: boolean, category: any }) {
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
        style={isActive ? { borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', gap: 6, alignItems: 'center' } : { display: 'flex', gap: 6, alignItems: 'center' }}
        onClick={toggle}
        disabled={loading}
      >
        {loading && <Spinner size={14} />}
        {isActive ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
