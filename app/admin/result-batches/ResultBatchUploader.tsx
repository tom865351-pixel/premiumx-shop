'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PreviewRow = {
  rowNumber: number
  accountId: string
  username: string
  status: 'valid' | 'invalid' | 'review' | 'unmatched'
  reason: string
  matched: boolean
  alreadyCredited: boolean
  currentStatus: string
  seller: string
  category: string
  price: number
  title: string
}

type CollectionBatchOption = {
  id: string
  categoryName: string
  mode: string
  statusFilter: string
  accountCount: number
  createdAt: string | Date
}

export default function ResultBatchUploader({ settings, collectionBatches = [] }: { settings: Record<string, string>; collectionBatches?: CollectionBatchOption[] }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [sheetUrl, setSheetUrl] = useState('')
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [fileHash, setFileHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [creditMode, setCreditMode] = useState(settings.bulk_result_credit_mode || 'instant')
  const [autoCredit, setAutoCredit] = useState(settings.bulk_result_auto_credit !== 'false')
  const [reasonMode, setReasonMode] = useState(settings.bulk_result_reason_mode || 'same')
  const [defaultReason, setDefaultReason] = useState(settings.bulk_result_default_reason || 'Invalid or not working account')
  const [note, setNote] = useState('')
  const [collectionBatchId, setCollectionBatchId] = useState('')
  const [unknownStatus, setUnknownStatus] = useState<'review' | 'valid' | 'invalid'>('review')

  const updateRow = (index: number, patch: Partial<PreviewRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const bulkSetStatus = (status: PreviewRow['status']) => {
    setRows((current) => current.map((row) => (row.matched && !row.alreadyCredited ? { ...row, status } : row)))
  }

  const preview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file && !sheetUrl.trim()) {
      setMessage('Choose an Excel file or paste a public Sheet link.')
      return
    }
    setLoading(true)
    setMessage('')
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (sheetUrl.trim()) formData.append('sheetUrl', sheetUrl.trim())
    formData.append('unknownStatus', unknownStatus)
    try {
      const res = await fetch('/api/admin/result-batches/preview', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setRows(data.rows || [])
      setFileName(data.fileName)
      setFileHash(data.fileHash)
      setMessage(`Preview ready: ${data.matchedRows}/${data.totalRows} rows matched. You can edit status and reason before applying.`)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const apply = async () => {
    if (rows.length === 0) return
    if (!confirm(`Apply ${rows.length} result rows?`)) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/result-batches/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, fileName, fileHash, creditMode, reasonMode, defaultReason, note, autoCredit, collectionBatchId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Apply failed')
      setMessage(`Applied: ${data.validRows} valid, ${data.invalidRows} invalid, ${data.reviewRows} review.`)
      setRows([])
      setFile(null)
      router.refresh()
      if (data.batchId) router.push(`/admin/result-batches/${data.batchId}`)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    if (!row.matched) acc.unmatched += 1
    if (row.alreadyCredited) acc.duplicate += 1
    return acc
  }, { valid: 0, invalid: 0, review: 0, unmatched: 0, duplicate: 0 } as Record<string, number>)

  return (
    <section className="card" style={{ padding: 20, marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Bulk Result Upload</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Blue/nil = valid, red/lal = invalid, yellow = review. Edit any row before apply.</p>
        </div>
        <a className="btn btn-outline" href="/api/admin/accounts/export?status=pending" target="_blank">Download Pending Excel</a>
      </div>

      <form onSubmit={preview} style={{ display: 'grid', gap: 14 }}>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Result Excel</label>
            <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Public Sheet/Excel Link</label>
            <input className="input" type="url" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="Google Sheet or Excel link" />
          </div>
          <div className="form-group">
            <label className="form-label">Auto Processing</label>
            <select className="select" value={autoCredit ? 'true' : 'false'} onChange={(e) => setAutoCredit(e.target.value === 'true')}>
              <option value="true">On - update accounts and wallet</option>
              <option value="false">Off - report/history only</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Credit Mode</label>
            <select className="select" value={creditMode} onChange={(e) => setCreditMode(e.target.value)}>
              <option value="instant">Instant wallet credit</option>
              <option value="pending">Pending payout first</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reject Reason Mode</label>
            <select className="select" value={reasonMode} onChange={(e) => setReasonMode(e.target.value)}>
              <option value="same">Same reason for all invalid</option>
              <option value="row">Row-wise reason column</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">If Color/Status Not Found</label>
            <select className="select" value={unknownStatus} onChange={(e) => setUnknownStatus(e.target.value as 'review' | 'valid' | 'invalid')}>
              <option value="review">Keep as review</option>
              <option value="valid">Mark unknown rows valid</option>
              <option value="invalid">Mark unknown rows invalid</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Related Collection Batch</label>
            <select className="select" value={collectionBatchId} onChange={(e) => setCollectionBatchId(e.target.value)}>
              <option value="">No collection batch selected</option>
              {collectionBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.categoryName} - {batch.accountCount} pcs - {new Date(batch.createdAt).toLocaleString('en-BD')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Reject Reason</label>
            <input className="input" value={defaultReason} onChange={(e) => setDefaultReason(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Note</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional batch note" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-gold" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Preview Excel'}</button>
          <button className="btn btn-blue" type="button" onClick={apply} disabled={loading || rows.length === 0}>{loading ? 'Working...' : 'Apply Result'}</button>
        </div>
      </form>

      {message && <div className="alert alert-info" style={{ marginTop: 14 }}>{message}</div>}

      {rows.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="grid-4" style={{ marginBottom: 14 }}>
            <Mini label="Valid" value={counts.valid} tone="success" />
            <Mini label="Invalid" value={counts.invalid} tone="danger" />
            <Mini label="Review" value={counts.review} tone="warning" />
            <Mini label="Unmatched/Duplicate" value={`${counts.unmatched}/${counts.duplicate}`} tone="info" />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>Bulk edit matched rows:</span>
            <button className="btn btn-sm btn-outline" type="button" onClick={() => bulkSetStatus('valid')}>Mark matched valid</button>
            <button className="btn btn-sm btn-outline" type="button" onClick={() => bulkSetStatus('invalid')}>Mark matched invalid</button>
            <button className="btn btn-sm btn-outline" type="button" onClick={() => bulkSetStatus('review')}>Mark matched review</button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Account</th>
                  <th>Seller</th>
                  <th>Platform</th>
                  <th>Amount</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 80).map((row, index) => (
                  <tr key={`${row.rowNumber}-${row.accountId}-${row.username}`}>
                    <td>{row.rowNumber}</td>
                    <td>
                      <select
                        className="select"
                        style={{ minWidth: 110, height: 34, fontSize: 12 }}
                        value={row.status}
                        onChange={(e) => updateRow(index, { status: e.target.value as PreviewRow['status'] })}
                      >
                        <option value="valid">valid</option>
                        <option value="invalid">invalid</option>
                        <option value="review">review</option>
                        <option value="unmatched">unmatched</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{row.title || row.username || row.accountId}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{row.matched ? row.currentStatus : 'Unmatched'} {row.alreadyCredited ? '- already paid' : ''}</div>
                    </td>
                    <td>{row.seller || '-'}</td>
                    <td>{row.category || '-'}</td>
                    <td>BDT {Number(row.price || 0).toLocaleString()}</td>
                    <td>
                      <input
                        className="input"
                        style={{ minWidth: 160, height: 34, fontSize: 12 }}
                        value={row.reason || ''}
                        placeholder={reasonMode === 'row' ? 'Row reason' : defaultReason}
                        onChange={(e) => updateRow(index, { reason: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 80 && <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Showing first 80 rows for editing. All {rows.length} rows will be processed on apply.</p>}
        </div>
      )}
    </section>
  )
}

function Mini({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div className={`text-${tone}`} style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  )
}
