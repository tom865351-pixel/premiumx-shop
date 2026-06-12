import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import TicketReplyForm from './TicketReplyForm'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { username: true, role: true } } }
      },
      user: { select: { username: true } }
    }
  })

  if (!ticket || (ticket.userId !== user.id && user.role !== 'admin' && user.role !== 'sub-admin')) {
    redirect('/support')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <a href="/support" className="btn btn-sm btn-outline">← All Tickets</a>
        </div>
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>🎫 {ticket.subject}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Ticket #{ticket.id.slice(-8).toUpperCase()} · by @{ticket.user.username} · {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge badge-${ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'success'}`}>
                {ticket.priority}
              </span>
              <span className={`badge badge-${ticket.status === 'open' ? 'success' : ticket.status === 'in-progress' ? 'warning' : 'danger'}`}>
                {ticket.status === 'open' ? '🟢 Open' : ticket.status === 'in-progress' ? '🟡 In Progress' : '⚫ Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {ticket.replies.map(reply => (
            <div key={reply.id} style={{
              display: 'flex',
              gap: 12,
              flexDirection: reply.isAdmin ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                background: reply.isAdmin ? 'rgba(212,175,55,0.2)' : 'rgba(147,51,234,0.2)'
              }}>
                {reply.isAdmin ? '👑' : '👤'}
              </div>
              <div style={{ flex: 1, maxWidth: '80%' }}>
                <div style={{
                  background: reply.isAdmin ? 'rgba(212,175,55,0.08)' : 'var(--surface)',
                  border: `1px solid ${reply.isAdmin ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '12px 16px'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: reply.isAdmin ? 'var(--gold)' : 'var(--purple)', marginBottom: 6 }}>
                    {reply.isAdmin ? '👑 Support Team' : `@${reply.user.username}`}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    {new Date(reply.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' ? (
          <TicketReplyForm ticketId={ticket.id} isAdmin={user.role === 'admin' || user.role === 'sub-admin'} />
        ) : (
          <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            ⚫ This ticket has been closed. <a href="/support/new" style={{ color: 'var(--gold)' }}>Open a new ticket</a> if you need more help.
          </div>
        )}
      </main>
    </div>
  )
}
