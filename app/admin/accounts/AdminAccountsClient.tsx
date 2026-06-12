'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'

export default function AdminAccountsClient({ accounts }: { accounts: any[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(accounts.filter(a => a.status === 'pending').map(a => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} accounts?`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/accounts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: selectedIds, action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk action failed')
      
      alert(data.message)
      setSelectedIds([])
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Accounts</h1>
          <p className="page-subtitle">Approve, reject, or delete submitted accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/api/admin/accounts/export" target="_blank" className="btn btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
            📊 Export Pending to Excel
          </a>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(212,175,55,0.1)', borderColor: 'var(--gold)' }}>
          <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{selectedIds.length} Accounts Selected</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-gold" onClick={() => handleBulkAction('approve')} disabled={loading}>
              {loading ? <Spinner size={16}/> : '✅ Approve Selected'}
            </button>
            <button className="btn btn-danger" onClick={() => handleBulkAction('reject')} disabled={loading}>
              ❌ Reject Selected
            </button>
          </div>
        </div>
      )}

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedIds.length > 0 && selectedIds.length === accounts.filter(a => a.status === 'pending').length}
                />
              </th>
              <th>ID / Title</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr><td colSpan={7} className="text-center">No accounts found</td></tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.id} style={{ background: selectedIds.includes(acc.id) ? 'var(--surface)' : 'transparent' }}>
                  <td>
                    {acc.status === 'pending' && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(acc.id)}
                        onChange={() => handleSelect(acc.id)}
                      />
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{acc.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {acc.id.slice(-6)}</div>
                  </td>
                  <td>{acc.category.icon} {acc.category.name}</td>
                  <td>@{acc.seller.username}</td>
                  <td className="font-mono text-gold">৳{acc.price}</td>
                  <td>
                    <span className={`badge badge-${
                      acc.status === 'approved' ? 'success' : 
                      acc.status === 'pending' ? 'warning' : 'danger'
                    }`}>
                      {acc.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {acc.status === 'pending' && (
                        <>
                          <form action={`/api/admin/accounts/${acc.id}/approve`} method="POST">
                            <button className="btn btn-sm btn-gold" type="submit">Approve</button>
                          </form>
                          <form action={`/api/admin/accounts/${acc.id}/reject`} method="POST">
                            <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} type="submit">Reject</button>
                          </form>
                        </>
                      )}
                      {acc.status !== 'pending' && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Processed</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
