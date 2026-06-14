import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

function StatusPill({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export default async function AdminAuditPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const [settings, categories, pendingAccounts, pendingWithdrawals, openTickets, failedTopups] = await Promise.all([
    getSettings(['maintenance_mode', 'bkash_number', 'nagad_number', 'rocket_number', 'payout_min_bdt', 'next_payout_time']),
    prisma.category.findMany({ include: { _count: { select: { accounts: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.account.count({ where: { status: 'pending' } }),
    prisma.withdrawal.count({ where: { status: 'pending' } }),
    prisma.ticket.count({ where: { status: { not: 'closed' } } }),
    prisma.topupRequest.count({ where: { status: 'rejected', method: 'zinipay' } }),
  ])

  const largeDataLogos = categories.filter((category) => category.icon?.startsWith('data:image/') && category.icon.length > 500_000)
  const emptyPaymentNumbers = ['bkash_number', 'nagad_number', 'rocket_number'].filter((key) => !settings[key])

  const issues = [
    {
      title: 'Category logo storage',
      detail: largeDataLogos.length ? `${largeDataLogos.length} logo image is too large for DB storage.` : 'Data logo upload is limited; cloud/file storage is still the better long-term option.',
      tone: largeDataLogos.length ? 'danger' : 'warning',
    },
    {
      title: 'Payment numbers',
      detail: emptyPaymentNumbers.length ? `${emptyPaymentNumbers.join(', ')} missing in settings.` : 'bKash/Nagad/Rocket numbers are configured.',
      tone: emptyPaymentNumbers.length ? 'danger' : 'success',
    },
    {
      title: 'Pending workload',
      detail: `${pendingAccounts} seller submissions, ${pendingWithdrawals} withdrawals, ${openTickets} support tickets need attention.`,
      tone: pendingAccounts + pendingWithdrawals + openTickets > 0 ? 'warning' : 'success',
    },
    {
      title: 'ZiniPay monitor',
      detail: failedTopups ? `${failedTopups} failed/rejected ZiniPay records found.` : 'No rejected ZiniPay records found.',
      tone: failedTopups ? 'warning' : 'success',
    },
    {
      title: 'Maintenance safety',
      detail: settings.maintenance_mode === 'true' ? 'Maintenance is on; login/register/reset pages stay accessible.' : 'Maintenance is off.',
      tone: settings.maintenance_mode === 'true' ? 'warning' : 'success',
    },
  ] as const

  const completed = [
    'Admin-side seller account details remain visible for review.',
    'Seller dashboard/submissions show grouped pieces instead of individual account credentials.',
    'Category add/edit/delete, active toggle, and logo image preview are available.',
    'Forgot password now creates an admin support reset request.',
    'Maintenance mode no longer blocks login/register/forgot-password pages.',
    'Wallet, withdrawal, ZiniPay, activity, risk, global search, support, live sessions, and notification tools are available.',
  ]

  const suggestions = [
    'Move category/logo/proof uploads to Cloudinary, S3, or Vercel Blob.',
    'Add batch submission IDs so 100 accounts appear as one seller batch.',
    'Add admin batch approve/reject with one note and seller notification.',
    'Add category account mover before deleting categories with old accounts.',
    'Add password reset token/email or OTP flow instead of admin-only reset.',
    'Add admin mobile card view for withdrawals, users, and deposits.',
    'Add admin reveal reason log before showing account password/2FA.',
    'Add ZiniPay retry/check-status button for pending gateway payments.',
    'Add payout method verification before large withdrawals.',
    'Add export history and download audit log.',
    'Add seller warning/strike automation for fake or repeated bad stock.',
    'Add weekly top sellers and payout leaderboard.',
    'Add fraud rule UI instead of JSON-only settings.',
    'Add rate limiting for login/register/forgot-password.',
    'Add site health button checker for important links and routes.',
    'Add maintenance preview message and scheduled maintenance timer.',
    'Add seller invoice PDF for each payout batch.',
    'Add dispute/refund timeline on admin reports.',
    'Add category reorder drag/drop for homepage/rates display.',
    'Add WhatsApp/Telegram notification integration after approval/payout.',
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Audit & Next Work</h1>
          <p className="page-subtitle">What is fixed, what still needs attention, and what to build next.</p>
        </div>
        <Link href="/admin/settings" className="btn btn-outline">Open Settings</Link>
      </div>

      <section className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Current Issues</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {issues.map((issue) => (
              <div key={issue.title} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <strong>{issue.title}</strong>
                  <StatusPill tone={issue.tone as any}>{issue.tone}</StatusPill>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{issue.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Already Fixed / Added</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {completed.map((item) => (
              <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                <StatusPill tone="success">OK</StatusPill>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Strong New Feature Suggestions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {suggestions.map((item, index) => (
            <div key={item} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--surface)' }}>
              <div style={{ color: 'var(--gold)', fontWeight: 900, marginBottom: 4 }}>#{index + 1}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
