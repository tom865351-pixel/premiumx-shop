'use client'
import { useEffect, useState } from 'react'
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

type SellerSummary = {
  stats: {
    pending: number
    approved: number
    rejected: number
    sold: number
    pendingValue: number
    totalEarnings: number
    approvalRate: number | null
    qualityLabel: string
  }
  recentTransactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>
  recentListings: Array<{ id: string; title: string; username: string; status: string; price: number; createdAt: string; category: { name: string } }>
}

export default function UserActions({ user }: { user: AdminUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<SellerSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [profile, setProfile] = useState({
    email: user.email,
    username: user.username,
    phone: user.phone || '',
    isVerified: user.isVerified,
    banReason: user.banReason || '',
  })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!open) return
    setSummaryLoading(true)
    fetch(`/api/admin/users/${user.id}/summary`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false))
  }, [open, user.id])

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
    const reason = prompt('Reason for this balance adjustment:')
    if (!reason?.trim()) {
      alert('Reason is required for wallet audit.')
      return
    }

    setLoading(true)
    try {
      const data = await requestJson(`/api/admin/users/${user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action, reason }),
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
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 820, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Seller Profile · @{user.username}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Full user profile, quality score, and control panel</div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => setOpen(false)} disabled={loading}>Close</button>
            </div>

            {summaryLoading ? (
              <div style={{ color: 'var(--text-muted)', padding: '8px 0 16px' }}>Loading seller stats...</div>
            ) : summary ? (
              <>
                <div className="grid-4" style={{ gap: 10, marginBottom: 16 }}>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Quality</div>
                    <div style={{ fontWeight: 900, color: summary.stats.qualityLabel === 'Needs review' ? 'var(--danger)' : 'var(--gold)' }}>
                      {summary.stats.qualityLabel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {summary.stats.approvalRate === null ? 'No decided accounts yet' : `${summary.stats.approvalRate}% approval`}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Pending Stock</div>
                    <div style={{ fontWeight: 900 }}>{summary.stats.pending}</div>
                    <div style={{ fontSize: 11, color: 'var(--warning)' }}>BDT {summary.stats.pendingValue.toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Approved / Rejected</div>
                    <div style={{ fontWeight: 900 }}>{summary.stats.approved + summary.stats.sold} / {summary.stats.rejected}</div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total Earnings</div>
                    <div style={{ fontWeight: 900, color: 'var(--success)' }}>BDT {summary.stats.totalEarnings.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 14, marginBottom: 16 }}>
                  <div className="card" style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Listings</div>
                    {summary.recentListings.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No listings yet</div>
                    ) : summary.recentListings.map((listing) => (
                      <div key={listing.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{listing.category.name}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{listing.username}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${listing.status === 'rejected' ? 'danger' : listing.status === 'pending' ? 'warning' : 'success'}`}>{listing.status}</span>
                          <div style={{ color: 'var(--gold)', marginTop: 4 }}>BDT {listing.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card" style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Wallet Audit Trail</div>
                    {summary.recentTransactions.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No transactions yet</div>
                    ) : summary.recentTransactions.map((tx) => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{tx.description}</div>
                        <div style={{ color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {tx.amount >= 0 ? '+' : '-'}BDT {Math.abs(tx.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

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
