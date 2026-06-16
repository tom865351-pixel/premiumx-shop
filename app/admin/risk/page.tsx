import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

export default async function AdminRiskPage() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'risk'))) redirect('/login')

  const [accounts, withdrawals, sellers] = await Promise.all([
    prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: { seller: true, category: true },
    }),
    prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.user.findMany({
      where: { listings: { some: {} } },
      include: { listings: true, withdrawals: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const duplicateUsernames = groupBy(accounts, (account) => account.username?.toLowerCase().trim())
    .filter((group) => group.key && group.items.length > 1)
    .slice(0, 12)

  const repeatedPayouts = groupBy(withdrawals, (withdrawal) => `${withdrawal.method}:${withdrawal.accountNumber}`.toLowerCase().trim())
    .filter((group) => group.key && new Set(group.items.map((item) => item.userId)).size > 1)
    .slice(0, 12)

  const sellerHealth = sellers.map((seller) => {
    const total = seller.listings.length
    const rejected = seller.listings.filter((account) => account.status === 'rejected').length
    const pending = seller.listings.filter((account) => account.status === 'pending').length
    const missingRecovery = seller.listings.filter((account) => !account.recoveryEmail && !account.recoveryPhone && !account.twoFASecret).length
    const rejectRate = total ? Math.round((rejected / total) * 100) : 0
    const riskScore = rejectRate + Math.min(40, missingRecovery * 5) + Math.min(20, pending * 2)
    return { seller, total, rejected, pending, missingRecovery, rejectRate, riskScore }
  }).sort((a, b) => b.riskScore - a.riskScore).slice(0, 15)

  const incompleteAccounts = accounts
    .filter((account) => !account.recoveryEmail && !account.recoveryPhone && !account.twoFASecret)
    .slice(0, 15)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk Center</h1>
          <p className="page-subtitle">Find duplicate stock, risky sellers, repeated payout numbers, and incomplete account data.</p>
        </div>
        <Link href="/admin/accounts" className="btn btn-gold">Review Accounts</Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <RiskStat label="Duplicate Login Groups" value={duplicateUsernames.length} tone="danger" />
        <RiskStat label="Repeated Payout Wallets" value={repeatedPayouts.length} tone="warning" />
        <RiskStat label="Risk Sellers" value={sellerHealth.filter((item) => item.riskScore >= 40).length} tone="danger" />
        <RiskStat label="Missing Recovery" value={incompleteAccounts.length} tone="warning" />
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        <RiskBlock title="Duplicate Account Logins">
          {duplicateUsernames.map((group) => (
            <div key={group.key} className="card" style={{ padding: 14 }}>
              <strong>{group.key}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                {group.items.map((account) => `@${account.seller.username} (${account.status})`).join(' - ')}
              </div>
            </div>
          ))}
        </RiskBlock>

        <RiskBlock title="Repeated Payout Wallets">
          {repeatedPayouts.map((group) => (
            <div key={group.key} className="card" style={{ padding: 14 }}>
              <strong>{group.items[0].method.toUpperCase()} - {group.items[0].accountNumber}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                Used by {Array.from(new Set(group.items.map((item) => `@${item.user.username}`))).join(', ')}
              </div>
            </div>
          ))}
        </RiskBlock>

        <RiskBlock title="Seller Health / Warning List">
          {sellerHealth.map((item) => (
            <div key={item.seller.id} className="card" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12 }}>
              <div>
                <strong>@{item.seller.username}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                  {item.total} stock - {item.pending} pending - {item.rejected} rejected - {item.rejectRate}% reject rate - {item.missingRecovery} missing recovery
                </div>
              </div>
              <span className={`badge badge-${item.riskScore >= 60 ? 'danger' : item.riskScore >= 30 ? 'warning' : 'success'}`}>
                Score {item.riskScore}
              </span>
            </div>
          ))}
        </RiskBlock>

        <RiskBlock title="Incomplete Recovery / 2FA Info">
          {incompleteAccounts.map((account) => (
            <div key={account.id} className="card" style={{ padding: 14 }}>
              <strong>{account.title}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                @{account.seller.username} - {account.category.name} - login {account.username} - {account.status}
              </div>
            </div>
          ))}
        </RiskBlock>
      </div>
    </div>
  )
}

function groupBy<T>(items: T[], keyFn: (item: T) => string | null | undefined) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!key) continue
    map.set(key, [...(map.get(key) || []), item])
  }
  return Array.from(map.entries()).map(([key, groupItems]) => ({ key, items: groupItems }))
}

function RiskStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="stat-card">
      <div>
        <div className={`stat-value text-${tone}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

function RiskBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {children || <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No risks found</div>}
      </div>
    </section>
  )
}
