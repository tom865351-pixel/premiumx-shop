'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserActions({ user }: { user: { id: string, isBanned: boolean, role: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleBan = async () => {
    setLoading(true)
    await fetch(`/api/admin/users/${user.id}/ban`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  if (user.role === 'admin') {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Admin</span>
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className={`btn btn-sm ${user.isBanned ? 'btn-gold' : 'btn-outline'}`}
        style={user.isBanned ? {} : { borderColor: 'var(--danger)', color: 'var(--danger)' }}
        onClick={toggleBan}
        disabled={loading}
      >
        {loading ? '...' : user.isBanned ? 'Unban' : 'Ban'}
      </button>
    </div>
  )
}
