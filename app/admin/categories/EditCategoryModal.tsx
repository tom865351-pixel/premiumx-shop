'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

export default function EditCategoryModal({ category }: { category: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: category.name,
    icon: category.icon,
    color: category.color,
    description: category.description || '',
    defaultPrice: category.defaultPrice.toString()
  })

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    fd.append('id', category.id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    await fetch('/api/admin/categories/edit', { method: 'POST', body: fd })

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button className="btn btn-sm btn-outline" onClick={() => setOpen(true)}>Edit</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Category</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>x</button>
            </div>
            <form onSubmit={submit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Icon / Short Label</label>
                  <input className="input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
                  <input className="input" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg" onChange={e => handleLogoFile(e.target.files?.[0])} style={{ marginTop: 8 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Price (BDT)</label>
                  <input className="input" type="number" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              {(form.icon?.startsWith('data:image') || form.icon?.startsWith('http') || form.icon?.startsWith('/')) && (
                <div className="form-group">
                  <label className="form-label">Logo Preview</label>
                  <img src={form.icon} alt="Category logo preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                  {loading ? <><Spinner size={18} /> Saving...</> : 'Save Changes'}
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
