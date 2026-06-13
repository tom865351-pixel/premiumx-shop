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

  const modifyBalance = async (action: 'add' | 'deduct') => {
    const amount = prompt(`Enter amount to ${action}:`)
    if (!amount || isNaN(parseFloat(amount))) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Success! New balance: ৳${data.newBalance}`)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const changeRole = async () => {
    const newRole = prompt(`Current role is ${user.role}. Enter new role (buyer, seller, admin):`)
    if (!newRole || !['buyer', 'seller', 'admin'].includes(newRole.toLowerCase())) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole.toLowerCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Role updated to ${newRole}!`)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (user.role === 'admin') {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Admin</span>
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        className="btn btn-sm btn-outline"
        onClick={() => modifyBalance('add')}
        disabled={loading}
        title="Add Balance"
      >
        💰+
      </button>
      <button
        className="btn btn-sm btn-outline"
        style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
        onClick={() => modifyBalance('deduct')}
        disabled={loading}
        title="Deduct Balance"
      >
        💰-
      </button>
      <button
        className="btn btn-sm btn-outline"
        onClick={changeRole}
        disabled={loading}
        title="Change Role"
      >
        👤 Role
      </button>
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
