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
  const validStatuses = ['pending', 'approved', 'sold', 'rejected']
  const filterStatus = validStatuses.includes(status) ? status : 'pending'

  // Fetch accounts by status
  const accounts = await prisma.account.findMany({
    where: { status: filterStatus },
    include: {
      category: { select: { name: true } },
      seller: { select: { username: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  const dateStr = new Date().toISOString().split('T')[0]

  // Format data for Excel
  const data = accounts.map((acc, idx) => ({
    No: idx + 1,
    Status: acc.status.toUpperCase(),
    Platform: acc.category.name,
    Seller_Username: acc.seller.username,
    Seller_Email: acc.seller.email,
    Account_Username: acc.username,
    Password: acc.password,
    Two_FA_Secret: acc.twoFASecret || '—',
    Price_BDT: `৳${acc.price}`,
    Submitted_Date: new Date(acc.createdAt).toLocaleDateString('en-BD', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    Account_ID: acc.id,
  }))

  // Create workbook with styled sheet name
  const sheetName = `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} (${accounts.length})`
  const worksheet = xlsx.utils.json_to_sheet(data)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
    { wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 30 }
  ]

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate buffer
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // Return as downloadable file with status + date + count in filename
  const filename = `premiumx_${filterStatus}_accounts_${accounts.length}pcs_${dateStr}.xlsx`
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
