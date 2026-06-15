import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

function statusBadge(status: string) {
  if (status === 'valid') return 'success'
  if (status === 'invalid') return 'danger'
  if (status === 'unmatched') return 'muted'
  return 'warning'
}

export default async function ResultBatchDetailPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) redirect('/login')

  const batch = await prisma.resultBatch.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { username: true } },
      rows: {
        include: {
          account: {
            select: {
              title: true,
              username: true,
              category: { select: { name: true } },
              seller: { select: { username: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!batch) notFound()

  const sellerTotals = batch.rows.reduce((acc, row) => {
    const seller = row.account?.seller?.username || 'Unmatched'
    const current = acc.get(seller) || { valid: 0, invalid: 0, review: 0, unmatched: 0, amount: 0, pending: 0 }
    if (row.status === 'valid') current.valid += 1
    if (row.status === 'invalid') current.invalid += 1
    if (row.status === 'review') current.review += 1
    if (row.status === 'unmatched') current.unmatched += 1
    if (row.credited) current.amount += row.price
    if (row.pending) current.pending += row.price
    acc.set(seller, current)
    return acc
  }, new Map<string, { valid: number; invalid: number; review: number; unmatched: number; amount: number; pending: number }>())

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/admin/result-batches" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Back to Upload Result</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>{batch.fileName}</h1>
          <p className="page-subtitle">
            Applied {new Date(batch.createdAt).toLocaleString()} by @{batch.admin.username} · {batch.status}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="btn btn-outline" href={`/api/admin/result-batches/${batch.id}/export?format=seller`}>Download Seller Sheets</a>
          <a className="btn btn-gold" href={`/api/admin/result-batches/${batch.id}/export?format=all`}>Download Full Report</a>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Mini label="Matched Rows" value={`${batch.matchedRows}/${batch.totalRows}`} />
        <Mini label="Valid / Invalid / Review" value={`${batch.validRows} / ${batch.invalidRows} / ${batch.reviewRows}`} tone="success" />
        <Mini label="Credited" value={`BDT ${batch.creditedAmount.toLocaleString()}`} tone="gold" />
        <Mini label="Pending Payout" value={`BDT ${batch.pendingAmount.toLocaleString()}`} tone="warning" />
      </div>

      {batch.note && (
        <div className="alert alert-info" style={{ marginBottom: 18 }}>Admin note: {batch.note}</div>
      )}

      <section className="card" style={{ padding: 20, marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Seller Summary</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Valid</th>
                <th>Invalid</th>
                <th>Review</th>
                <th>Unmatched</th>
                <th>Credited</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(sellerTotals.entries()).map(([seller, totals]) => (
                <tr key={seller}>
                  <td style={{ fontWeight: 800 }}>{seller}</td>
                  <td>{totals.valid}</td>
                  <td>{totals.invalid}</td>
                  <td>{totals.review}</td>
                  <td>{totals.unmatched}</td>
                  <td className="text-success">BDT {totals.amount.toLocaleString()}</td>
                  <td className="text-warning">BDT {totals.pending.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>All Rows ({batch.rows.length})</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Account</th>
                <th>Seller</th>
                <th>Platform</th>
                <th>Amount</th>
                <th>Credit</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {batch.rows.map((row) => (
                <tr key={row.id}>
                  <td><span className={`badge badge-${statusBadge(row.status)}`}>{row.status}</span></td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{row.account?.title || row.username}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{row.previousStatus ? `was ${row.previousStatus}` : ''}</div>
                  </td>
                  <td>{row.account?.seller?.username || '-'}</td>
                  <td>{row.account?.category?.name || '-'}</td>
                  <td>BDT {row.price.toLocaleString()}</td>
                  <td>
                    {row.credited ? <span className="badge badge-success">Credited</span> : null}
                    {row.pending ? <span className="badge badge-warning">Pending</span> : null}
                    {!row.credited && !row.pending ? '-' : null}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div className={tone ? `text-${tone}` : undefined} style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  )
}
