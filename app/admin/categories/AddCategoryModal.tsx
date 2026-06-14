'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategoryLogo, { isImageIcon } from '@/components/ui/CategoryLogo'

export default function AddCategoryModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', icon: 'PX', color: '#9333EA', description: '', defaultPrice: '0' })

  const handleLogoFile = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, icon: String(reader.result || current.icon) }))
    reader.readAsDataURL(file)
  }

  const useTextLabel = () => {
    const label = form.name.trim().slice(0, 2).toUpperCase() || 'PX'
    setForm((current) => ({ ...current, icon: label }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    await fetch('/api/admin/categories/create', { method: 'POST', body: fd })
    setOpen(false)
    router.refresh()
    setLoading(false)
    setForm({ name: '', icon: 'PX', color: '#9333EA', description: '', defaultPrice: '0' })
  }

  return (
    <>
      <button className="btn btn-gold" onClick={() => setOpen(true)}>+ Add Category</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add New Category</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>x</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Netflix, Spotify..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Icon / Short Label</label>
                  <input
                    className="input"
                    value={isImageIcon(form.icon) ? '' : form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    placeholder={isImageIcon(form.icon) ? 'Image logo selected' : 'IG'}
                  />
                  <input className="input" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg" onChange={e => handleLogoFile(e.target.files?.[0])} style={{ marginTop: 8 }} />
                  {isImageIcon(form.icon) && (
                    <button type="button" className="btn btn-sm btn-outline" onClick={useTextLabel} style={{ marginTop: 8 }}>
                      Use Text Label
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Default Price (BDT)</label>
                  <input className="input" type="number" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
              </div>
              {isImageIcon(form.icon) && (
                <div className="form-group">
                  <label className="form-label">Logo Preview</label>
                  <CategoryLogo icon={form.icon} name={form.name} color={form.color} size={56} radius={10} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Creating...' : 'Create Category'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
