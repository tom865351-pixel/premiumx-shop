import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all pending accounts
  const accounts = await prisma.account.findMany({
    where: { status: 'pending' },
    include: {
      category: { select: { name: true } },
      seller: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  // Format data for Excel
  const data = accounts.map(acc => ({
    ID: acc.id,
    Platform: acc.category.name,
    Seller: acc.seller.username,
    Username_or_Email: acc.username,
    Password: acc.password,
    Two_FA_Secret: acc.twoFASecret || '',
    Price_BDT: acc.price,
    Submitted_At: acc.createdAt.toLocaleString(),
  }))

  // Create workbook
  const worksheet = xlsx.utils.json_to_sheet(data)
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Pending Accounts')

  // Generate buffer
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // Return as downloadable file
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="pending_accounts_${new Date().toISOString().split('T')[0]}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
