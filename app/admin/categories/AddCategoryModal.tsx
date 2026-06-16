'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategoryLogo, { isImageIcon } from '@/components/ui/CategoryLogo'
import { DEFAULT_SELLER_FIELDS, SELLER_FIELD_OPTIONS, type SellerFieldKey } from '@/lib/categoryFields'

export default function AddCategoryModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    icon: 'PX',
    color: '#9333EA',
    description: '',
    defaultPrice: '0',
    videoUrl: '',
    enabledFields: DEFAULT_SELLER_FIELDS,
  })

  const toggleField = (field: SellerFieldKey) => {
    if (field === 'username' || field === 'password') return
    setForm((current) => ({
      ...current,
      enabledFields: current.enabledFields.includes(field)
        ? current.enabledFields.filter((item) => item !== field)
        : [...current.enabledFields, field],
    }))
  }

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
    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'enabledFields') fd.append(k, String(v))
    })
    form.enabledFields.forEach((field) => fd.append('enabledFields', field))
    await fetch('/api/admin/categories/create', { method: 'POST', body: fd })
    setOpen(false)
    router.refresh()
    setLoading(false)
    setForm({ name: '', icon: 'PX', color: '#9333EA', description: '', defaultPrice: '0', videoUrl: '', enabledFields: DEFAULT_SELLER_FIELDS })
  }

  return (
    <>
      <button className="btn btn-gold" onClick={() => setOpen(true)}>+ Add Category</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div className="card modal-scroll-card" style={{ width: '100%', maxWidth: 560, padding: 24 }}>
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
              <div className="form-group">
                <label className="form-label">Guide Video URL (optional)</label>
                <input className="input" type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="YouTube or video link for this category" />
              </div>
              <div className="form-group">
                <label className="form-label">Seller Form Fields</label>
                <div className="category-field-grid">
                  {SELLER_FIELD_OPTIONS.map((field) => {
                    const locked = field.required
                    const checked = locked || form.enabledFields.includes(field.key)
                    return (
                      <label key={field.key} className="category-field-toggle">
                        <input
                          type="checkbox"
                          name="enabledFields"
                          value={field.key}
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggleField(field.key)}
                        />
                        <span>{field.label}{locked ? ' *' : ''}</span>
                      </label>
                    )
                  })}
                </div>
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
