'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import CategoryLogo from '@/components/ui/CategoryLogo'
import styles from './AdminAccounts.module.css'

type Status = 'pending' | 'approved' | 'sold' | 'rejected'
type QueueFilter = 'new' | 'old' | 'high-value' | 'incomplete'

const STATUS_CONFIG: Record<Status, { label: string; badge: string; icon: string; color: string }> = {
  pending: { label: 'Pending', badge: 'badge-warning', icon: 'WAIT', color: '#f59e0b' },
  approved: { label: 'Bought', badge: 'badge-success', icon: 'OK', color: '#10b981' },
  sold: { label: 'Sold', badge: 'badge-purple', icon: 'SOLD', color: '#9333ea' },
  rejected: { label: 'Rejected', badge: 'badge-danger', icon: 'NO', color: '#ef4444' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function qualityScore(account: any) {
  let score = 35
  if (account.username) score += 10
  if (account.password) score += 10
  if (account.twoFASecret) score += 15
  if (account.recoveryEmail || account.recoveryPhone) score += 15
  if (account.accountAge) score += 8
  if (account.description) score += 7
  return Math.min(100, score)
}

function isIncomplete(account: any) {
  return !account.twoFASecret && !account.recoveryEmail && !account.recoveryPhone
}

function proofLinks(account: any) {
  try {
    const parsed = JSON.parse(account.screenshots || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export default function AdminAccountsClient({ accounts, rejectTemplates = '' }: { accounts: any[]; rejectTemplates?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Status>('pending')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('new')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null)
  const [revealedIds, setRevealedIds] = useState<string[]>([])

  const groupedByStatus = {
    pending: accounts.filter((account) => account.status === 'pending'),
    approved: accounts.filter((account) => account.status === 'approved'),
    sold: accounts.filter((account) => account.status === 'sold'),
    rejected: accounts.filter((account) => account.status === 'rejected'),
  }

  const sellerGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    let visibleAccounts = groupedByStatus[activeTab].filter((account) => {
      if (!q) return true
      return (
        account.title?.toLowerCase().includes(q) ||
        account.username?.toLowerCase().includes(q) ||
        account.seller?.username?.toLowerCase().includes(q) ||
        account.seller?.email?.toLowerCase().includes(q) ||
        account.category?.name?.toLowerCase().includes(q)
      )
    })

    if (activeTab === 'pending') {
      if (queueFilter === 'old') {
        visibleAccounts = [...visibleAccounts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      } else if (queueFilter === 'high-value') {
        visibleAccounts = [...visibleAccounts].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
      } else if (queueFilter === 'incomplete') {
        visibleAccounts = visibleAccounts.filter(isIncomplete)
      } else {
        visibleAccounts = [...visibleAccounts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    }

    const map = new Map<string, any>()
    for (const account of visibleAccounts) {
      const id = account.seller?.id || 'unknown'
      if (!map.has(id)) {
        map.set(id, {
          seller: account.seller,
          accounts: [],
          total: 0,
          latest: account.createdAt,
        })
      }
      const group = map.get(id)
      group.accounts.push(account)
      group.total += Number(account.price || 0)
      if (new Date(account.createdAt) > new Date(group.latest)) group.latest = account.createdAt
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime())
  }, [accounts, activeTab, search, queueFilter])

  const visibleAccountIds = sellerGroups.flatMap((group) => group.accounts.map((account: any) => account.id))

  const handleBulkAction = async (action: 'approve' | 'reject', ids = selectedIds) => {
    if (ids.length === 0) return
    const note = action === 'reject'
      ? prompt(`Reject reason:\n${rejectTemplates || 'Wrong password\nDuplicate account\nIncomplete details'}`, rejectTemplates.split('\n').filter(Boolean)[0] || '')
      : prompt('Approval note or price note (optional):', '')
    if (action === 'reject' && note === null) return
    if (action === 'approve' && note === null) return
    if (!confirm(`Are you sure you want to ${action} ${ids.length} accounts?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/accounts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: ids, action, note }),
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
    await handleBulkAction(action, [accountId])
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

  const toggleSellerSelection = (ids: string[]) => {
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => allSelected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])))
  }

  const revealAccount = (account: any) => {
    if (!confirm(`Reveal password for ${account.title}? This should only be used for admin review.`)) return
    setRevealedIds((prev) => Array.from(new Set([...prev, account.id])))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Seller Submissions</h1>
          <p className="page-subtitle">Users sell accounts here. Review each seller group, buy approved stock, and export seller-wise files.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/admin/result-batches" className="btn btn-gold">
            Upload Result Report
          </a>
          <a href={`/api/admin/accounts/export?status=${activeTab}`} target="_blank" className="btn btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }}>
            Export All {STATUS_CONFIG[activeTab].label}
          </a>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
            const cfg = STATUS_CONFIG[status]
            const isActive = activeTab === status
            return (
              <button
                key={status}
                className={styles.tab}
                onClick={() => {
                  setActiveTab(status)
                  setSelectedIds([])
                  setSearch('')
                  setExpandedSellerId(null)
                }}
                style={{
                  borderColor: isActive ? cfg.color : undefined,
                  background: isActive ? `${cfg.color}18` : undefined,
                  color: isActive ? cfg.color : undefined,
                }}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="badge badge-muted">{groupedByStatus[status].length}</span>
              </button>
            )
          })}
        </div>
        {activeTab === 'pending' && (
          <select className={`form-input ${styles.queueSelect}`} value={queueFilter} onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="high-value">High value first</option>
            <option value="incomplete">Missing recovery/2FA</option>
          </select>
        )}
        <input
          type="text"
          placeholder="Search seller, platform, username..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`form-input ${styles.search}`}
        />
      </div>

      {selectedIds.length > 0 && activeTab === 'pending' && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 16px', background: 'rgba(212,175,55,0.08)', borderColor: 'var(--gold)' }}>
          <div style={{ fontWeight: 800, color: 'var(--gold)' }}>{selectedIds.length} accounts selected</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-gold btn-sm" onClick={() => handleBulkAction('approve')} disabled={loading}>
              {loading ? <Spinner size={16} /> : 'Buy Selected'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('reject')} disabled={loading} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Reject Selected
            </button>
          </div>
        </div>
      )}

      {sellerGroups.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No seller submissions found</div>
          <div>Try another status or search term.</div>
        </div>
      ) : (
        <div className={styles.sellerList}>
          {sellerGroups.map((group) => {
            const seller = group.seller || { id: 'unknown', username: 'unknown', email: 'N/A' }
            const sellerId = seller.id || 'unknown'
            const ids = group.accounts.map((account: any) => account.id)
            const isOpen = expandedSellerId === sellerId
            const allSelected = ids.every((id: string) => selectedIds.includes(id))

            return (
              <section key={sellerId} className={styles.sellerCard}>
                <div className={styles.sellerHeader} onClick={() => setExpandedSellerId(isOpen ? null : sellerId)}>
                  <div className={styles.sellerMain}>
                    <div className={styles.avatar}>{seller.username?.slice(0, 2).toUpperCase() || 'U'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.sellerName}>@{seller.username}</div>
                      <div className={styles.sellerMeta}>{seller.email} · latest {formatDate(group.latest)}</div>
                    </div>
                  </div>
                  <div className={styles.sellerStats}>
                    <span className={styles.pill}>{group.accounts.length} accounts</span>
                    <span className={styles.pill}>BDT {group.total.toLocaleString()}</span>
                    <a className="btn btn-sm btn-outline" href={`/api/admin/accounts/export?status=${activeTab}&sellerId=${sellerId}`} target="_blank" onClick={(event) => event.stopPropagation()}>
                      Download Seller
                    </a>
                    {activeTab === 'pending' && (
                      <button className="btn btn-sm btn-outline" onClick={(event) => { event.stopPropagation(); toggleSellerSelection(ids) }}>
                        {allSelected ? 'Unselect' : 'Select Seller'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-gold">{isOpen ? 'Hide' : 'View'}</button>
                  </div>
                </div>

                {isOpen && (
                  <div className={styles.accounts}>
                    {group.accounts.map((account: any) => {
                      return (
                        <article key={account.id} className={styles.accountCard}>
                          {activeTab === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(account.id)}
                              onChange={() => setSelectedIds((prev) => prev.includes(account.id) ? prev.filter((id) => id !== account.id) : [...prev, account.id])}
                            />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div className={styles.accountTitle}>{account.title}</div>
                            <div className={styles.credential}>User: {account.username}</div>
                            <div className={styles.credential}>
                              Pass: {revealedIds.includes(account.id) ? account.password : 'Hidden until reveal'}
                            </div>
                            {account.twoFASecret && (
                              <div className={styles.credential}>
                                2FA: {revealedIds.includes(account.id) ? account.twoFASecret : 'Hidden until reveal'}
                              </div>
                            )}
                            {account.recoveryEmail && <div className={styles.credential}>Recovery email: {account.recoveryEmail}</div>}
                            {account.recoveryPhone && <div className={styles.credential}>Recovery phone: {account.recoveryPhone}</div>}
                            {account.accountAge && <div className={styles.credential}>Age: {account.accountAge}</div>}
                            <div className={styles.platform} style={{ marginTop: 8 }}>
                              <CategoryLogo icon={account.category?.icon} name={account.category?.name} color={account.category?.color} size={26} radius={7} />
                              <span>{account.category?.name}</span>
                              <span className={`badge ${STATUS_CONFIG[account.status as Status]?.badge || 'badge-muted'}`}>{account.status}</span>
                              <span className="text-gold">BDT {Number(account.price).toLocaleString()}</span>
                              <span className={`badge badge-${qualityScore(account) >= 75 ? 'success' : qualityScore(account) >= 55 ? 'warning' : 'danger'}`}>Quality {qualityScore(account)}</span>
                              {isIncomplete(account) && <span className="badge badge-warning">Missing recovery/2FA</span>}
                              {proofLinks(account).length > 0 && (
                                <a href={proofLinks(account)[0]} target="_blank" className="badge badge-info" onClick={(event) => event.stopPropagation()}>
                                  Proof
                                </a>
                              )}
                            </div>
                          </div>
                          <div className={styles.actions}>
                            {account.status === 'pending' && (
                              <>
                                <button className="btn btn-sm btn-gold" onClick={() => handleSingleAction(account.id, 'approve')} disabled={loading}>Buy</button>
                                <button className="btn btn-sm btn-outline" onClick={() => handleSingleAction(account.id, 'reject')} disabled={loading} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Reject</button>
                              </>
                            )}
                            {!revealedIds.includes(account.id) && (
                              <button className="btn btn-sm btn-outline" onClick={() => revealAccount(account)} disabled={loading}>Reveal</button>
                            )}
                            <button className="btn btn-sm btn-outline" onClick={() => handleDelete(account.id)} disabled={loading} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <div className={styles.summary}>
        {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => (
          <div key={status} className={styles.summaryCard}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{STATUS_CONFIG[status].label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: STATUS_CONFIG[status].color }}>{groupedByStatus[status].length}</div>
          </div>
        ))}
        <div className={styles.summaryCard}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Visible Sellers</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--blue)' }}>{sellerGroups.length}</div>
        </div>
      </div>
    </div>
  )
}
