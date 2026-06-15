'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategoryLogo from '@/components/ui/CategoryLogo'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  defaultPrice: number
}

export default function SellForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCategory) return

    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          categoryId: selectedCategory.id,
          title: `${selectedCategory.name} Account`,
        }),
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to submit account')

      setMessage({ type: 'success', text: 'Account submitted for admin review. Your wallet will update after approval.' })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCategory) return

    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('categoryId', selectedCategory.id)

    try {
      const res = await fetch('/api/sell/bulk', {
        method: 'POST',
        body: formData,
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to process file')

      setMessage({
        type: 'success',
        text: resData.message || `Uploaded ${resData.count} accounts for admin review. Your wallet will update after approval.`,
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!selectedCategory ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20 }}>1. Select Platform</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Choose what stock you want PremiumX to buy</p>
          </div>
          <div className="sell-category-grid">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="sell-category-btn"
                style={{
                  borderColor: 'var(--border)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = cat.color)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <CategoryLogo className="sell-category-logo" icon={cat.icon} name={cat.name} color={cat.color} size={48} radius={8} />
                <span className="sell-category-title">{cat.name}</span>
                <span className="sell-category-price">BDT {cat.defaultPrice} each</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="card card-glass" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <button type="button" onClick={() => setSelectedCategory(null)} className="btn btn-sm btn-outline" style={{ padding: '4px 8px' }}>Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <CategoryLogo icon={selectedCategory.icon} name={selectedCategory.name} color={selectedCategory.color} size={36} radius={8} />
              <h2 style={{ fontSize: 18, lineHeight: 1.2 }}>Sell {selectedCategory.name} Account</h2>
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <button type="button" className={`tab ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>Single Upload</button>
            <button type="button" className={`tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>Bulk Excel Upload</button>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: 20 }}>
              {message.text}
            </div>
          )}

          <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)', borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--gold)' }}>PremiumX Buying Rate (Per Account)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Grotesk' }}>
              BDT {selectedCategory.defaultPrice}
            </div>
          </div>

          {activeTab === 'single' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Username / Email</label>
                <input type="text" name="username" required placeholder="Account username or email" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="text" name="password" required placeholder="Account password" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">2FA Secret Code (Optional)</label>
                <input type="text" name="twoFASecret" placeholder="Paste 2FA secret or recovery code here" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Recovery Email (Optional)</label>
                <input type="text" name="recoveryEmail" placeholder="Recovery email if available" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Recovery Phone (Optional)</label>
                <input type="text" name="recoveryPhone" placeholder="Recovery phone if available" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Account Age / Proof Link (Optional)</label>
                <input type="text" name="accountAge" placeholder="Example: 2 years old" className="form-input" style={{ marginBottom: 10 }} />
                <input type="url" name="proofLink" placeholder="Screenshot/proof link" className="form-input" />
              </div>

              <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <div className="spinner" /> : 'Submit for Review'}
              </button>
            </form>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 8, background: 'var(--surface)', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)', marginBottom: 16 }}>EXCEL</div>
              <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Upload Excel/CSV or Paste Sheet Link</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
                Use public Google Sheets or Excel links. Columns: <strong>Username</strong> and <strong>Password</strong>, or username in A and password in B.
              </p>
              <a href="/api/sell/bulk/template" className="btn btn-outline w-full text-center" style={{ marginBottom: 14 }}>
                Download Excel Template
              </a>

              <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <input
                  type="file"
                  name="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ background: 'var(--bg)', padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
                />
                <input
                  type="url"
                  name="sheetUrl"
                  placeholder="Or paste public Google Sheet / Excel link"
                  className="form-input"
                  style={{ width: '100%' }}
                />
                <button type="submit" className="btn btn-gold w-full" disabled={loading}>
                  {loading ? <div className="spinner" /> : 'Upload Bulk Accounts'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
