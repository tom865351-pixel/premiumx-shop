import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') || 'pending'
  const sellerId = req.nextUrl.searchParams.get('sellerId')
  const validStatuses = ['pending', 'approved', 'sold', 'rejected']
  const filterStatus = validStatuses.includes(status) ? status : 'pending'

  const accounts = await prisma.account.findMany({
    where: {
      status: filterStatus,
      ...(sellerId ? { sellerId } : {}),
    },
    include: {
      category: { select: { name: true } },
      seller: { select: { username: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const dateStr = new Date().toISOString().split('T')[0]
  const sellerName = accounts[0]?.seller?.username

  const data = accounts.map((acc, idx) => ({
    No: idx + 1,
    Status: acc.status.toUpperCase(),
    Platform: acc.category.name,
    Seller_Username: acc.seller.username,
    Seller_Email: acc.seller.email,
    Account_Username: acc.username,
    Password: acc.password,
    Two_FA_Secret: acc.twoFASecret || '-',
    Price_BDT: `BDT ${acc.price}`,
    Submitted_Date: new Date(acc.createdAt).toLocaleDateString('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    Account_ID: acc.id,
  }))

  const sheetTitle = sellerName ? `${sellerName} ${filterStatus}` : `${filterStatus} accounts`
  const sheetName = `${sheetTitle.slice(0, 24)} (${accounts.length})`
  const worksheet = xlsx.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 24 },
    { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 30 },
  ]

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName)
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  const sellerPart = sellerName ? `_${sellerName}` : ''
  const filename = `premiumx${sellerPart}_${filterStatus}_${accounts.length}pcs_${dateStr}.xlsx`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
