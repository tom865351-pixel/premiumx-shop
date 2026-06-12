'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

type Status = 'pending' | 'approved' | 'sold' | 'rejected'

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: string; color: string }> = {
  pending:  { label: 'Pending',  badge: 'badge-warning', icon: '⏳', color: '#f59e0b' },
  approved: { label: 'Approved', badge: 'badge-success', icon: '✅', color: '#10b981' },
  sold:     { label: 'Sold',     badge: 'badge-purple',  icon: '💰', color: '#9333ea' },
  rejected: { label: 'Rejected', badge: 'badge-danger',  icon: '❌', color: '#ef4444' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminAccountsClient({ accounts }: { accounts: any[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Status>('pending')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const grouped = {
    pending:  accounts.filter(a => a.status === 'pending'),
    approved: accounts.filter(a => a.status === 'approved'),
    sold:     accounts.filter(a => a.status === 'sold'),
    rejected: accounts.filter(a => a.status === 'rejected'),
  }

  const filtered = grouped[activeTab].filter(a =>
    !search ||
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.seller?.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? filtered.map(a => a.id) : [])
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
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

  const handleSingleAction = async (accountId: string, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/${accountId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Delete this account permanently?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/${accountId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📂 Manage Accounts</h1>
          <p className="page-subtitle">View and manage all submitted accounts by status.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`/api/admin/accounts/export?status=${activeTab}`}
            target="_blank"
            className="btn btn-outline"
            style={{ color: '#10b981', borderColor: '#10b981' }}
          >
            📊 Export {STATUS_CONFIG[activeTab].label} to Excel
          </a>
        </div>
      </div>

      {/* Status Tabs with counts */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(Object.keys(STATUS_CONFIG) as Status[]).map(status => {
          const cfg = STATUS_CONFIG[status]
          const count = grouped[status].length
          const isActive = activeTab === status
          return (
            <button
              key={status}
              onClick={() => { setActiveTab(status); setSelectedIds([]); setSearch('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                border: `2px solid ${isActive ? cfg.color : 'var(--border)'}`,
                background: isActive ? `${cfg.color}18` : 'var(--surface)',
                color: isActive ? cfg.color : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: 14,
              }}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span style={{
                background: isActive ? cfg.color : 'rgba(255,255,255,0.08)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                borderRadius: 20,
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 800
              }}>
                {count}
              </span>
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="🔍 Search by seller, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ width: 220, padding: '8px 14px', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && activeTab === 'pending' && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(212,175,55,0.08)', borderColor: 'var(--gold)' }}>
          <div style={{ fontWeight: 600, color: 'var(--gold)' }}>⚡ {selectedIds.length} accounts selected</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-gold" onClick={() => handleBulkAction('approve')} disabled={loading}>
              {loading ? <Spinner size={16} /> : '✅ Approve All Selected'}
            </button>
            <button className="btn btn-outline" onClick={() => handleBulkAction('reject')} disabled={loading} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              ❌ Reject All Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* File header - shows status + count + date range */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: `${STATUS_CONFIG[activeTab].color}10`
        }}>
          <span style={{ fontSize: 20 }}>{STATUS_CONFIG[activeTab].icon}</span>
          <div>
            <div style={{ fontWeight: 700, color: STATUS_CONFIG[activeTab].color, fontSize: 15 }}>
              {STATUS_CONFIG[activeTab].label} Accounts — {filtered.length} total
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filtered.length > 0
                ? `From ${formatDate(filtered[filtered.length - 1].createdAt)} → ${formatDate(filtered[0].createdAt)}`
                : 'No accounts in this category'
              }
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No {STATUS_CONFIG[activeTab].label} accounts</div>
          </div>
        ) : (
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                {activeTab === 'pending' && (
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                    />
                  </th>
                )}
                <th>#</th>
                <th>Account Info</th>
                <th>Category</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc, idx) => (
                <>
                  <tr
                    key={acc.id}
                    style={{ background: selectedIds.includes(acc.id) ? 'rgba(212,175,55,0.05)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                  >
                    {activeTab === 'pending' && (
                      <td onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(acc.id)}
                          onChange={() => handleSelect(acc.id)}
                        />
                      </td>
                    )}
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{acc.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {acc.username}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {acc.category.icon} {acc.category.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--blue)', fontWeight: 600 }}>@{acc.seller.username}</span>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>৳{acc.price}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(acc.createdAt)}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {acc.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-gold"
                              onClick={() => handleSingleAction(acc.id, 'approve')}
                              disabled={loading}
                              style={{ padding: '4px 10px', fontSize: 12 }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleSingleAction(acc.id, 'reject')}
                              disabled={loading}
                              style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 10px', fontSize: 12 }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDelete(acc.id)}
                          disabled={loading}
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 10px', fontSize: 12 }}
                          title="Delete permanently"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row - shows password & 2FA */}
                  {expandedId === acc.id && (
                    <tr key={`${acc.id}-detail`} style={{ background: 'rgba(14,165,233,0.04)' }}>
                      <td colSpan={activeTab === 'pending' ? 9 : 8} style={{ padding: '12px 24px' }}>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>USERNAME / EMAIL</div>
                            <code style={{ fontSize: 13, color: 'var(--blue)' }}>{acc.username}</code>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PASSWORD</div>
                            <code style={{ fontSize: 13, color: 'var(--gold)' }}>{acc.password}</code>
                          </div>
                          {acc.twoFASecret && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>2FA SECRET</div>
                              <code style={{ fontSize: 13, color: '#10b981' }}>{acc.twoFASecret}</code>
                            </div>
                          )}
                          {acc.description && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{acc.description}</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {(Object.keys(STATUS_CONFIG) as Status[]).map(status => (
            <div key={status} className="card" style={{ flex: 1, minWidth: 120, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{STATUS_CONFIG[status].icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: STATUS_CONFIG[status].color }}>{grouped[status].length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{STATUS_CONFIG[status].label}</div>
            </div>
          ))}
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>📦</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>{accounts.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total All</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>💵</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>
              ৳{grouped.sold.reduce((s: number, a: any) => s + a.price, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Revenue</div>
          </div>
        </div>
      )}
    </div>
  )
}
