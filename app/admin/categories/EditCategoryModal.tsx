'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import CategoryLogo, { isImageIcon } from '@/components/ui/CategoryLogo'
import { DEFAULT_SELLER_FIELDS, SELLER_FIELD_OPTIONS, parseCategoryFieldConfig, type SellerFieldKey } from '@/lib/categoryFields'

export default function EditCategoryModal({ category }: { category: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const categoryConfig = parseCategoryFieldConfig(category.fields)
  const [form, setForm] = useState({
    name: category.name,
    icon: category.icon,
    color: category.color,
    description: category.description || '',
    defaultPrice: category.defaultPrice.toString(),
    videoUrl: categoryConfig.videoUrl || '',
    enabledFields: categoryConfig.enabledFields || DEFAULT_SELLER_FIELDS,
    fieldLabels: Object.fromEntries(
      SELLER_FIELD_OPTIONS.map((field) => [field.key, categoryConfig.labels?.[field.key] || field.label]),
    ) as Record<SellerFieldKey, string>,
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

  const updateFieldLabel = (field: SellerFieldKey, label: string) => {
    setForm((current) => ({
      ...current,
      fieldLabels: { ...current.fieldLabels, [field]: label },
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
    fd.append('id', category.id)
    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'enabledFields' && k !== 'fieldLabels') fd.append(k, String(v))
    })
    form.enabledFields.forEach((field) => fd.append('enabledFields', field))
    Object.entries(form.fieldLabels).forEach(([field, label]) => fd.append(`fieldLabel_${field}`, label))

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
          <div className="card modal-scroll-card" style={{ width: '100%', maxWidth: 560, padding: 24 }}>
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
                  <input
                    className="input"
                    value={isImageIcon(form.icon) ? '' : form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    placeholder={isImageIcon(form.icon) ? 'Image logo selected' : 'IG, FB, PX...'}
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
                  <input className="input" type="number" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                <div className="category-field-label-editor">
                  {SELLER_FIELD_OPTIONS.map((field) => (
                    <div className="form-group" key={`label-${field.key}`}>
                      <label className="form-label">{field.label} text</label>
                      <input
                        className="input"
                        value={form.fieldLabels[field.key] || field.label}
                        onChange={(e) => updateFieldLabel(field.key, e.target.value)}
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {isImageIcon(form.icon) && (
                <div className="form-group">
                  <label className="form-label">Logo Preview</label>
                  <CategoryLogo icon={form.icon} name={form.name} color={form.color} size={56} radius={10} />
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
