import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'
import ResultBatchUploader from './ResultBatchUploader'

export default async function ResultBatchesPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const settings = await getSettings(['bulk_result_credit_mode', 'bulk_result_reason_mode', 'bulk_result_default_reason', 'bulk_result_allow_color'])
  let setupError = ''
  let batches: any[] = []

  try {
    batches = await prisma.resultBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { admin: { select: { username: true } }, rows: { take: 5 } },
    })
  } catch (error) {
    console.error('Result batch history failed to load', error)
    setupError = isMissingResultBatchTables(error)
      ? RESULT_BATCH_SETUP_MESSAGE
      : 'Result upload history could not be loaded right now. Please try again after a refresh.'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk Result Auto Report</h1>
          <p className="page-subtitle">Upload result Excel, auto approve/reject seller stock, credit wallet or hold pending payout, and notify every seller.</p>
        </div>
      </div>

      {setupError ? (
        <section className="card" style={{ padding: 20, marginBottom: 18, borderColor: 'var(--warning)', background: 'rgba(245,158,11,0.08)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--warning)' }}>Result Upload Setup Needed</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>{setupError}</p>
          <div style={{ display: 'grid', gap: 8, color: 'var(--text)', fontSize: 14 }}>
            <div><strong>Where this page is:</strong> Admin Panel - Upload Result</div>
            <div><strong>Upload box:</strong> ei card-er jaygay setup complete hole file choose + Preview Excel button ashbe.</div>
            <div><strong>After setup:</strong> upload the blue/red Excel report here to auto-send seller reports.</div>
          </div>
          <form action="/api/admin/result-batches/setup" method="POST" style={{ marginTop: 16 }}>
            <button className="btn btn-gold" type="submit">Fix Database & Show Upload</button>
          </form>
        </section>
      ) : (
        <ResultBatchUploader settings={settings} />
      )}

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Result History</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Rows</th>
                <th>Result</th>
                <th>Money</th>
                <th>Mode</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan={7} className="text-center">No result batches yet</td></tr>
              ) : batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <div style={{ fontWeight: 900 }}>{batch.fileName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(batch.createdAt).toLocaleString()} - {batch.status}</div>
                  </td>
                  <td>{batch.matchedRows}/{batch.totalRows}</td>
                  <td>
                    <span className="badge badge-success">{batch.validRows} valid</span>{' '}
                    <span className="badge badge-danger">{batch.invalidRows} invalid</span>{' '}
                    <span className="badge badge-warning">{batch.reviewRows} review</span>
                  </td>
                  <td>
                    <div>Credited: BDT {batch.creditedAmount.toLocaleString()}</div>
                    <div style={{ color: 'var(--warning)' }}>Pending: BDT {batch.pendingAmount.toLocaleString()}</div>
                  </td>
                  <td>{batch.creditMode} / {batch.reasonMode}</td>
                  <td>@{batch.admin.username}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {batch.pendingAmount > 0 && batch.status !== 'rolled_back' && (
                        <form action={`/api/admin/result-batches/${batch.id}/release`} method="POST">
                          <button className="btn btn-sm btn-gold" type="submit">Release Pending</button>
                        </form>
                      )}
                      {batch.status !== 'rolled_back' && (
                        <form action={`/api/admin/result-batches/${batch.id}/rollback`} method="POST">
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} type="submit">Rollback</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
