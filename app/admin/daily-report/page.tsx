import Link from 'next/link'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

function money(amount = 0) {
  return `BDT ${Number(amount).toLocaleString()}`
}

export default async function DailyReportPage() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'dailyReport'))) redirect('/login')

  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const [
    submittedToday,
    approvedToday,
    rejectedToday,
    topupsToday,
    withdrawalsToday,
    ticketToday,
    topSellers,
    revenue7,
    payouts7,
  ] = await Promise.all([
    prisma.account.count({ where: { createdAt: { gte: since } } }),
    prisma.account.count({ where: { updatedAt: { gte: since }, status: 'approved' } }),
    prisma.account.count({ where: { updatedAt: { gte: since }, status: 'rejected' } }),
    prisma.topupRequest.aggregate({ _sum: { amount: true }, _count: true, where: { createdAt: { gte: since } } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, _count: true, where: { createdAt: { gte: since } } }),
    prisma.ticket.count({ where: { createdAt: { gte: since } } }),
    prisma.user.findMany({
      where: { listings: { some: {} } },
      take: 10,
      include: { listings: true, withdrawals: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: daysAgo(7) }, status: 'approved' } }),
  ])

  const sellers = topSellers
    .map((seller) => ({
      username: seller.username,
      submitted: seller.listings.length,
      approved: seller.listings.filter((account) => account.status === 'approved' || account.status === 'sold').length,
      rejected: seller.listings.filter((account) => account.status === 'rejected').length,
      paid: seller.withdrawals.filter((withdrawal) => withdrawal.status === 'approved').reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
    }))
    .sort((a, b) => b.approved - a.approved)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Report</h1>
          <p className="page-subtitle">Today stock, approvals, deposits, payouts, support and top seller snapshot.</p>
        </div>
        <Link href="/api/admin/withdrawals/export" className="btn btn-gold" target="_blank">Download Payout Sheet</Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Submitted Today" value={submittedToday} tone="info" />
        <Stat label="Approved Today" value={approvedToday} tone="success" />
        <Stat label="Rejected Today" value={rejectedToday} tone="danger" />
        <Stat label="Support Today" value={ticketToday} tone="warning" />
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Stat label="Topups Today" value={money(topupsToday._sum.amount || 0)} tone="success" />
        <Stat label="Withdrawals Today" value={money(withdrawalsToday._sum.amount || 0)} tone="warning" />
        <Stat label="7 Day Revenue" value={money(revenue7._sum.amount || 0)} tone="gold" />
        <Stat label="7 Day Payouts" value={money(payouts7._sum.amount || 0)} tone="danger" />
      </div>

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Top Sellers Snapshot</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Submitted</th>
                <th>Approved/Sold</th>
                <th>Rejected</th>
                <th>Paid Out</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.username}>
                  <td>@{seller.username}</td>
                  <td>{seller.submitted}</td>
                  <td className="text-success">{seller.approved}</td>
                  <td className="text-danger">{seller.rejected}</td>
                  <td className="font-mono text-gold">{money(seller.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="stat-card">
      <div>
        <div className={`stat-value text-${tone}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
