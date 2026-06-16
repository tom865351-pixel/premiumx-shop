import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSetting } from '@/lib/settings'
import TicketReplyForm from '@/app/support/[id]/TicketReplyForm'
import { canAccessAdminArea } from '@/lib/permissions'

export default async function AdminTicketDetail({ params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'support'))) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  const [ticket, rawTemplates] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { username: true, role: true } } },
        },
        user: { select: { username: true, email: true } },
      },
    }),
    getSetting('support_reply_templates'),
  ])

  if (!ticket) redirect('/admin/support')
  const templates = (rawTemplates || 'Thanks for contacting PremiumX. We are checking this now.\nPlease send your transaction ID and payment method.\nYour issue has been solved. We are closing this ticket.')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/support" className="btn btn-sm btn-outline">Back to all tickets</a>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{ticket.subject}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              By @{ticket.user.username} ({ticket.user.email}) - #{ticket.id.slice(-8).toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge badge-${ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'success'}`}>{ticket.priority}</span>
            <span className={`badge badge-${ticket.status === 'open' ? 'success' : ticket.status === 'in-progress' ? 'warning' : 'muted'}`}>{ticket.status}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {ticket.replies.map(reply => (
          <div key={reply.id} style={{ display: 'flex', gap: 12, flexDirection: reply.isAdmin ? 'row-reverse' : 'row' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontWeight: 900, background: reply.isAdmin ? 'rgba(212,175,55,0.2)' : 'rgba(147,51,234,0.2)', color: reply.isAdmin ? 'var(--gold)' : 'var(--purple)' }}>
              {reply.isAdmin ? 'PX' : reply.user.username.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, maxWidth: '80%' }}>
              <div style={{ background: reply.isAdmin ? 'rgba(212,175,55,0.08)' : 'var(--surface)', border: `1px solid ${reply.isAdmin ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: reply.isAdmin ? 'var(--gold)' : 'var(--purple)', marginBottom: 6 }}>
                  {reply.isAdmin ? 'Support Team' : `@${reply.user.username}`}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(reply.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <TicketReplyForm ticketId={ticket.id} isAdmin={true} templates={templates} />
      )}
    </div>
  )
}
