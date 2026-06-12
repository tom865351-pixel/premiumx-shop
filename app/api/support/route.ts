import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/support — create ticket
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, message, priority } = await req.json()
  if (!subject || !message) return NextResponse.json({ error: 'Subject and message required' }, { status: 400 })

  const ticket = await prisma.ticket.create({
    data: {
      userId: authUser.userId,
      subject,
      priority: priority || 'normal',
      replies: {
        create: {
          userId: authUser.userId,
          message,
          isAdmin: false,
        }
      }
    }
  })

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: 'admin' } })
  await Promise.all(admins.map(admin =>
    prisma.notification.create({
      data: {
        userId: admin.id,
        title: `New Support Ticket 🎫`,
        message: `"${subject}" — Priority: ${priority || 'normal'}`,
        type: priority === 'urgent' ? 'danger' : 'info',
        link: `/admin/support/${ticket.id}`,
      }
    })
  ))

  return NextResponse.json({ ticketId: ticket.id })
}

// GET /api/support — list user's tickets
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await prisma.ticket.findMany({
    where: { userId: authUser.userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { replies: true } } }
  })

  return NextResponse.json(tickets)
}
