'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategoryLogo from '@/components/ui/CategoryLogo'
import { getYouTubeEmbedUrl, parseCategoryFieldConfig, SELLER_FIELD_OPTIONS, type SellerFieldKey } from '@/lib/categoryFields'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  defaultPrice: number
  fields: string
}

export default function SellForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const selectedConfig = parseCategoryFieldConfig(selectedCategory?.fields)
  const enabledFields = new Set<SellerFieldKey>(['username', 'password', ...selectedConfig.enabledFields])
  const videoEmbedUrl = getYouTubeEmbedUrl(selectedConfig.videoUrl)

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

          {selectedConfig.videoUrl && (
            <div className="sell-guide-video">
              {videoEmbedUrl ? (
                <iframe
                  src={videoEmbedUrl}
                  title={`${selectedCategory.name} seller guide`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <a href={selectedConfig.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline w-full">
                  Watch {selectedCategory.name} Seller Guide
                </a>
              )}
            </div>
          )}

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
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}>
              BDT {selectedCategory.defaultPrice}
            </div>
          </div>

          {activeTab === 'single' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SELLER_FIELD_OPTIONS.filter((field) => enabledFields.has(field.key)).map((field) => (
                <div className="form-group" key={field.key}>
                  <label className="form-label">{selectedConfig.labels?.[field.key] || field.label}{field.required ? '' : ' (Optional)'}</label>
                  <input
                    type={field.key === 'proofLink' ? 'url' : 'text'}
                    name={field.key}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="form-input"
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><div className="spinner" /> Submitting...</> : 'Submit for Review'}
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
