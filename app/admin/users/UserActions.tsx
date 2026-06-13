'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  username: string
  phone: string | null
  role: string
  balance: number
  isBanned: boolean
  isVerified: boolean
  banReason: string | null
}

export default function UserActions({ user }: { user: AdminUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({
    email: user.email,
    username: user.username,
    phone: user.phone || '',
    isVerified: user.isVerified,
    banReason: user.banReason || '',
  })
  const [newPassword, setNewPassword] = useState('')

  const refresh = () => {
    router.refresh()
    setLoading(false)
  }

  const requestJson = async (url: string, options: RequestInit) => {
    const res = await fetch(url, options)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  const toggleBan = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${user.id}/ban`, { method: 'POST' })
      refresh()
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  const modifyBalance = async (action: 'add' | 'deduct') => {
    const amount = prompt(`Enter amount to ${action}:`)
    if (!amount || isNaN(parseFloat(amount))) return

    setLoading(true)
    try {
      const data = await requestJson(`/api/admin/users/${user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action }),
      })
      alert(`Success. New balance: BDT ${data.newBalance}`)
      refresh()
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  const changeRole = async (role: string) => {
    setLoading(true)
    try {
      await requestJson(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      refresh()
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      await requestJson(`/api/admin/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      refresh()
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await requestJson(`/api/admin/users/${user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      setNewPassword('')
      alert('Password has been reset.')
      refresh()
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-sm btn-outline" onClick={() => setOpen(true)}>
        Manage
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !loading && setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Manage User</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Full user profile and control panel</div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => setOpen(false)} disabled={loading}>Close</button>
            </div>

            <div className="grid-2" style={{ gap: 14 }}>
              <label>
                <div className="form-label">Email</div>
                <input className="form-input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </label>
              <label>
                <div className="form-label">Username</div>
                <input className="form-input" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
              </label>
              <label>
                <div className="form-label">Phone Number</div>
                <input className="form-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </label>
              <label>
                <div className="form-label">Account Status</div>
                <select className="form-input" value={profile.isVerified ? 'verified' : 'unverified'} onChange={(e) => setProfile({ ...profile, isVerified: e.target.value === 'verified' })}>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'block', marginTop: 14 }}>
              <div className="form-label">Ban Reason / Internal Note</div>
              <input className="form-input" value={profile.banReason} onChange={(e) => setProfile({ ...profile, banReason: e.target.value })} placeholder="Optional note" />
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <button className="btn btn-gold btn-sm" onClick={saveProfile} disabled={loading}>Save Profile</button>
              <button className={`btn btn-sm ${user.isBanned ? 'btn-gold' : 'btn-outline'}`} style={user.isBanned ? {} : { borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={toggleBan} disabled={loading}>
                {user.isBanned ? 'Unban User' : 'Ban User'}
              </button>
            </div>

            <div className="divider" />

            <div className="grid-2" style={{ gap: 14 }}>
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Balance Control</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>Current balance: BDT {user.balance.toLocaleString()}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => modifyBalance('add')} disabled={loading}>Add Balance</button>
                  <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => modifyBalance('deduct')} disabled={loading}>Deduct</button>
                </div>
              </div>

              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Role Control</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>Current role: {user.role}</div>
                <select className="form-input" value={user.role} onChange={(e) => changeRole(e.target.value)} disabled={loading}>
                  <option value="buyer">buyer</option>
                  <option value="seller">seller</option>
                  <option value="stock-manager">stock-manager</option>
                  <option value="sub-admin">sub-admin</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Password Reset</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
                Current password cannot be viewed because it is stored as a secure hash. Set a new password below.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ flex: '1 1 220px' }} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                <button className="btn btn-sm btn-outline" onClick={resetPassword} disabled={loading}>Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
