import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function money(amount = 0) {
  return `BDT ${Number(amount).toLocaleString()}`
}

function smallDate(value: Date) {
  return new Date(value).toLocaleString()
}

export default async function AdminSearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const authUser = await getAuthUser()
  if (!authUser || !['admin', 'sub-admin', 'stock-manager'].includes(authUser.role)) redirect('/login')

  const q = (searchParams.q || '').trim()
  const hasQuery = q.length >= 2

  const [users, accounts, deposits, withdrawals, tickets] = hasQuery ? await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { listings: true, withdrawals: true, topupRequests: true } } },
    }),
    prisma.account.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { recoveryEmail: { contains: q, mode: 'insensitive' } },
          { seller: { username: { contains: q, mode: 'insensitive' } } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: { seller: true, category: true },
    }),
    prisma.topupRequest.findMany({
      where: {
        OR: [
          { transactionId: { contains: q, mode: 'insensitive' } },
          { method: { contains: q, mode: 'insensitive' } },
          { user: { username: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.withdrawal.findMany({
      where: {
        OR: [
          { accountNumber: { contains: q, mode: 'insensitive' } },
          { reference: { contains: q, mode: 'insensitive' } },
          { method: { contains: q, mode: 'insensitive' } },
          { user: { username: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.ticket.findMany({
      where: {
        OR: [
          { subject: { contains: q, mode: 'insensitive' } },
          { user: { username: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
  ]) : [[], [], [], [], []]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Search</h1>
          <p className="page-subtitle">Search users, sellers, accounts, TrxID, withdrawal numbers, and support tickets from one place.</p>
        </div>
      </div>

      <form style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <input name="q" defaultValue={q} className="input" placeholder="Search username, email, phone, TrxID, account..." style={{ minWidth: 260, flex: 1 }} />
        <button className="btn btn-gold" type="submit">Search</button>
      </form>

      {!hasQuery ? (
        <div className="card" style={{ padding: 28, color: 'var(--text-muted)' }}>
          Type at least 2 characters to search across the admin panel.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          <ResultBlock title={`Users (${users.length})`}>
            {users.map((user) => (
              <ResultRow key={user.id} href={`/admin/users?search=${user.username}`} title={`@${user.username}`} badge={user.role}>
                {user.email} {user.phone ? `- ${user.phone}` : ''} - Balance {money(user.balance)} - {user._count.listings} listings
              </ResultRow>
            ))}
          </ResultBlock>

          <ResultBlock title={`Accounts (${accounts.length})`}>
            {accounts.map((account) => (
              <ResultRow key={account.id} href="/admin/accounts" title={account.title} badge={account.status}>
                @{account.seller.username} - {account.category.name} - Login {account.username} - {money(account.price)}
              </ResultRow>
            ))}
          </ResultBlock>

          <ResultBlock title={`Deposits (${deposits.length})`}>
            {deposits.map((deposit) => (
              <ResultRow key={deposit.id} href="/admin/deposits" title={deposit.transactionId || deposit.id} badge={deposit.status}>
                @{deposit.user.username} - {deposit.method.toUpperCase()} - {money(deposit.amount)} - {smallDate(deposit.createdAt)}
              </ResultRow>
            ))}
          </ResultBlock>

          <ResultBlock title={`Withdrawals (${withdrawals.length})`}>
            {withdrawals.map((withdrawal) => (
              <ResultRow key={withdrawal.id} href="/admin/withdrawals" title={withdrawal.accountNumber} badge={withdrawal.status}>
                @{withdrawal.user.username} - {withdrawal.method.toUpperCase()} - {money(withdrawal.amount)} - {smallDate(withdrawal.createdAt)}
              </ResultRow>
            ))}
          </ResultBlock>

          <ResultBlock title={`Support Tickets (${tickets.length})`}>
            {tickets.map((ticket) => (
              <ResultRow key={ticket.id} href={`/admin/support/${ticket.id}`} title={ticket.subject} badge={ticket.priority}>
                @{ticket.user.username} - {ticket.status} - {smallDate(ticket.createdAt)}
              </ResultRow>
            ))}
          </ResultBlock>
        </div>
      )}
    </div>
  )
}

function ResultBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {children || <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No results</div>}
      </div>
    </section>
  )
}

function ResultRow({ href, title, badge, children }: { href: string; title: string; badge: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', textDecoration: 'none', flexWrap: 'wrap' }}>
      <span>
        <strong>{title}</strong>
        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{children}</span>
      </span>
      <span className="badge badge-muted">{badge}</span>
    </Link>
  )
}
