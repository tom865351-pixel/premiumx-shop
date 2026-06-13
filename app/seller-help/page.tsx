import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'

export default async function SellerHelpPage() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null
  const nextPayout = await getSetting('next_payout_time')

  const faqs = [
    ['How do I sell accounts?', 'Go to Sell, choose a platform, then submit username, password, recovery info and 2FA if available.'],
    ['When do I get paid?', 'Admin reviews the account first. If it is valid, balance is added to your wallet.'],
    ['How do withdrawals work?', `Request withdrawal from Wallet. Payout schedule: ${nextPayout}.`],
    ['Why can an account be rejected?', 'Wrong password, duplicate stock, missing recovery details, risky account, or incomplete information.'],
    ['Can I upload many accounts?', 'Yes. Use Bulk Excel Upload with username, password and optional 2FA columns.'],
    ['How do I join live classes?', 'Open Live Sessions and use the join link or class recording/resource links.'],
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      <main className="container" style={{ padding: '36px 20px 110px', flex: 1, maxWidth: 980 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Seller Help Center</h1>
            <p className="page-subtitle">Rules, payout flow, Excel upload tips, and live class resources for PremiumX sellers.</p>
          </div>
          <Link href="/sell" className="btn btn-gold">Submit Stock</Link>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {faqs.map(([title, text]) => (
            <article key={title} className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, marginBottom: 8 }}>{title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{text}</p>
            </article>
          ))}
        </div>

        <section className="card" style={{ marginTop: 18, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Quick Links</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/browse" className="btn btn-outline">View Rates</Link>
            <Link href="/wallet" className="btn btn-outline">Wallet</Link>
            <Link href="/live" className="btn btn-outline">Live Sessions</Link>
            <Link href="/support/new" className="btn btn-outline">Open Support Ticket</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
