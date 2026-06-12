import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import Link from 'next/link'

export default async function SupportPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      replies: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { replies: true } }
    }
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 900 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">🎫 Support Tickets</h1>
            <p className="page-subtitle">Get help from our support team. We reply within a few hours.</p>
          </div>
          <Link href="/support/new" className="btn btn-gold">+ New Ticket</Link>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-title">No tickets yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Have a problem? Create a support ticket and we&apos;ll help you out!
            </p>
            <Link href="/support/new" className="btn btn-gold">Create Ticket</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(ticket => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--border)' }}
                  onMouseOver={(e: any) => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={(e: any) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{ticket.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ticket._count.replies} replies · Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge badge-${ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'success'}`} style={{ fontSize: 11 }}>
                      {ticket.priority}
                    </span>
                    <span className={`badge badge-${ticket.status === 'open' ? 'success' : ticket.status === 'in-progress' ? 'warning' : 'danger'}`}>
                      {ticket.status === 'open' ? '🟢 Open' : ticket.status === 'in-progress' ? '🟡 In Progress' : '⚫ Closed'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
