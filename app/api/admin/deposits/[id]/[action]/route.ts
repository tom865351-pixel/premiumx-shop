import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, action: string } }
) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser || !(await canAccessAdminArea(authUser.role, 'deposits'))) {
      // Because this is a form submission, let's redirect back with error or just redirect
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { id, action } = params

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.redirect(new URL('/admin/deposits?error=Invalid action', req.url))
    }

    const deposit = await prisma.topupRequest.findUnique({
      where: { id }
    })

    if (!deposit || deposit.status !== 'pending') {
      return NextResponse.redirect(new URL('/admin/deposits?error=Invalid deposit', req.url))
    }

    if (action === 'approve') {
      // Use transaction to update deposit and add balance
      await prisma.$transaction([
        prisma.topupRequest.update({
          where: { id },
          data: { status: 'approved' }
        }),
        prisma.user.update({
          where: { id: deposit.userId },
          data: { balance: { increment: deposit.amount } }
        }),
          prisma.transaction.create({
            data: {
              userId: deposit.userId,
              amount: deposit.amount,
              type: 'topup',
              description: `Manual deposit approved (${deposit.method})`,
              balance: deposit.amount, // Note: Ideally should be exact user balance + amount
              topupId: deposit.id
            }
          }),
        prisma.notification.create({
          data: {
            userId: deposit.userId,
            title: 'Deposit Approved',
            message: `Your deposit of ৳${deposit.amount} has been approved and added to your wallet.`,
            type: 'success'
          }
        })
      ])
    } else if (action === 'reject') {
      await prisma.$transaction([
        prisma.topupRequest.update({
          where: { id },
          data: { status: 'rejected' }
        }),
        prisma.notification.create({
          data: {
            userId: deposit.userId,
            title: 'Deposit Rejected',
            message: `Your deposit request for ৳${deposit.amount} was rejected. Please contact support if you think this is a mistake.`,
            type: 'error'
          }
        })
      ])
    }

    return NextResponse.redirect(new URL('/admin/deposits?success=1', req.url))
  } catch (error) {
    console.error('Admin deposit action error:', error)
    return NextResponse.redirect(new URL('/admin/deposits?error=Server error', req.url))
  }
}
