import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { message, close } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // Only ticket owner or admin can reply
  const isAdmin = user.role === 'admin' || user.role === 'sub-admin'
  if (ticket.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const newStatus = close && isAdmin ? 'closed' : ticket.status === 'open' && isAdmin ? 'in-progress' : ticket.status

  await prisma.$transaction([
    prisma.ticketReply.create({
      data: {
        ticketId: params.id,
        userId: user.id,
        message,
        isAdmin,
      }
    }),
    prisma.ticket.update({
      where: { id: params.id },
      data: { status: newStatus, updatedAt: new Date() }
    })
  ])

  // Notify the other party
  const notifyUserId = isAdmin ? ticket.userId : null
  if (notifyUserId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: isAdmin ? '👑 Support Team Replied' : 'New Reply on Your Ticket',
        message: `Re: "${ticket.subject}"`,
        type: 'info',
        link: `/support/${ticket.id}`,
      }
    })
  }

  return NextResponse.json({ success: true })
}
