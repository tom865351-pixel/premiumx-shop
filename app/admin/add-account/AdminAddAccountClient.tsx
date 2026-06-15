'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  defaultPrice: number
}

export default function AdminAddAccountClient({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [selectedCategory, setSelectedCategory] = useState('')

  const handleSingle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/admin/add-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setMessage({ type: 'success', text: `✅ Account added successfully! ID: ${json.account?.id?.slice(-8)}` })
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleBulk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBulkLoading(true)
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    fd.append('categoryId', selectedCategory)
    try {
      const res = await fetch('/api/admin/add-account/bulk', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setMessage({ type: 'success', text: `✅ ${json.count} accounts added and automatically APPROVED!` })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBulkLoading(false)
    }
  }

  const cat = categories.find(c => c.id === selectedCategory)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">➕ Add Account</h1>
          <p className="page-subtitle">Manually add accounts to the marketplace. They will be instantly approved.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'single', label: '✍️ Single Account', icon: '✍️' },
          { id: 'bulk', label: '📊 Bulk Excel Upload', icon: '📊' },
        ].map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: `2px solid ${activeTab === tab.id ? 'var(--blue)' : 'var(--border)'}`,
              background: activeTab === tab.id ? 'rgba(14,165,233,0.1)' : 'var(--surface)',
              color: activeTab === tab.id ? 'var(--blue)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 20, fontWeight: 600,
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Category Selector */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, display: 'block', fontWeight: 600 }}>
          SELECT PLATFORM / CATEGORY
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                border: `2px solid ${selectedCategory === c.id ? c.color : 'var(--border)'}`,
                background: selectedCategory === c.id ? `${c.color}15` : 'var(--surface)',
                color: selectedCategory === c.id ? c.color : 'var(--text-secondary)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              {c.name}
              <span style={{ fontSize: 12, background: selectedCategory === c.id ? c.color : 'rgba(255,255,255,0.1)', color: selectedCategory === c.id ? '#000' : 'var(--text-muted)', borderRadius: 20, padding: '1px 8px' }}>
                ৳{c.defaultPrice}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!selectedCategory ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>☝️</div>
          <div style={{ fontSize: 16 }}>Please select a platform above to continue</div>
        </div>
      ) : activeTab === 'single' ? (
        // Single Account Form
        <div className="card" style={{ padding: 28, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 28 }}>{cat?.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{cat?.name} Account</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Will be auto-approved immediately ✅</div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>
              ৳{cat?.defaultPrice}
            </div>
          </div>

          <form onSubmit={handleSingle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="hidden" name="categoryId" value={selectedCategory} />
            <input type="hidden" name="status" value="approved" />

            <div className="form-group">
              <label className="form-label">Username / Email *</label>
              <input type="text" name="username" required placeholder="Account username or email" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="text" name="password" required placeholder="Account password" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">2FA Secret (Optional)</label>
              <input type="text" name="twoFASecret" placeholder="2FA secret or backup code" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea name="description" placeholder="Account details, age, followers, etc." className="form-input" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Followers Count (Optional)</label>
              <input type="number" name="followersCount" placeholder="e.g. 5000" className="form-input" min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Age (Optional)</label>
              <input type="text" name="accountAge" placeholder="e.g. 3 years" className="form-input" />
            </div>

            <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? '⏳ Adding...' : '✅ Add & Approve Account'}
            </button>
          </form>
        </div>
      ) : (
        // Bulk Upload
        <div className="card" style={{ padding: 28, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 28 }}>{cat?.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Bulk Upload — {cat?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All accounts will be auto-approved instantly ✅</div>
            </div>
          </div>

          {/* Template download hint */}
          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--blue)', marginBottom: 6 }}>📋 Excel Format Required:</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Columns: <strong>Username</strong> | <strong>Password</strong> | <strong>2FA</strong> (optional)<br />
              First row should be headers. Each row = one account.
            </div>
          </div>

          <form onSubmit={handleBulk} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              required
              style={{ background: 'var(--surface)', padding: 12, borderRadius: 10, border: '2px dashed var(--border)', width: '100%', cursor: 'pointer' }}
            />
            <button type="submit" className="btn btn-gold w-full" disabled={bulkLoading}>
              {bulkLoading ? '⏳ Processing...' : '📊 Upload & Auto-Approve All'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
