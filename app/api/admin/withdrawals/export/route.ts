import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'
import { canAccessAdminArea } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'withdrawals'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') || 'pending'
  const withdrawals = await prisma.withdrawal.findMany({
    where: { status },
    include: { user: { select: { username: true, email: true, phone: true, balance: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const data = withdrawals.map((withdrawal, index) => ({
    No: index + 1,
    Seller: withdrawal.user.username,
    Email: withdrawal.user.email,
    Phone: withdrawal.user.phone || '',
    Method: withdrawal.method.toUpperCase(),
    Wallet_Number: withdrawal.accountNumber,
    Amount_BDT: withdrawal.amount,
    Status: withdrawal.status,
    Reference: withdrawal.reference || '',
    Admin_Note: withdrawal.adminNote || '',
    Requested_At: new Date(withdrawal.createdAt).toLocaleString('en-BD'),
    Withdrawal_ID: withdrawal.id,
  }))

  const worksheet = xlsx.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 12 },
    { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 30 },
  ]

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, `${status} payouts`.slice(0, 31))
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const dateStr = new Date().toISOString().split('T')[0]

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="premiumx_${status}_payouts_${dateStr}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
