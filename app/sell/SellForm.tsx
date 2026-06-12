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

      setMessage({ type: 'success', text: 'Account submitted successfully! Waiting for admin approval.' })
      
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

      setMessage({ type: 'success', text: `Successfully uploaded ${resData.count} accounts! Waiting for admin approval.` })
      
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
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Choose the type of account you want to sell</p>
          </div>
          <div className="grid-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="card"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = cat.color)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ fontSize: 36 }}>{cat.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="card card-glass" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setSelectedCategory(null)} className="btn btn-sm btn-outline" style={{ padding: '4px 8px' }}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{selectedCategory.icon}</span>
              <h2 style={{ fontSize: 18 }}>Sell {selectedCategory.name} Account</h2>
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <button className={`tab ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>✍️ Single Upload</button>
            <button className={`tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>📁 Bulk Excel Upload</button>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: 20 }}>
              {message.text}
            </div>
          )}

          <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)', borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--gold)' }}>Fixed Selling Price (Per Account)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Grotesk' }}>
              ৳{selectedCategory.defaultPrice}
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

              <button type="submit" className="btn btn-gold w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <div className="spinner" /> : 'Submit Account'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 12, background: 'var(--surface)', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
              <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Upload Excel or CSV</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
                Make sure your file has columns named: <strong>Username</strong>, <strong>Password</strong>, and optionally <strong>2FA</strong>.
              </p>
              
              <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <input 
                  type="file" 
                  name="file" 
                  accept=".xlsx, .xls, .csv" 
                  required 
                  style={{ background: 'var(--bg)', padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
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
