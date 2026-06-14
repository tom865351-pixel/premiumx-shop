import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, phone, message } = await req.json()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPhone = String(phone || '').trim()
  const cleanMessage = String(message || '').trim()

  if (!cleanEmail && !cleanPhone) {
    return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        cleanEmail ? { email: cleanEmail } : undefined,
        cleanPhone ? { phone: cleanPhone } : undefined,
      ].filter(Boolean) as any,
    },
  })

  if (user) {
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: 'Password reset request',
        priority: 'high',
        replies: {
          create: {
            userId: user.id,
            isAdmin: false,
            message: [
              `Password reset requested for @${user.username}.`,
              cleanEmail ? `Email: ${cleanEmail}` : '',
              cleanPhone ? `Phone: ${cleanPhone}` : '',
              cleanMessage ? `Message: ${cleanMessage}` : '',
            ].filter(Boolean).join('\n'),
          },
        },
      },
    })

    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    await Promise.all(admins.map((admin) => prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Password reset request',
        message: `@${user.username} requested admin password reset.`,
        type: 'warning',
        link: `/admin/support/${ticket.id}`,
      },
    })))
  }

  return NextResponse.json({
    success: true,
    message: 'If the account exists, admin support received your reset request.',
  })
}
