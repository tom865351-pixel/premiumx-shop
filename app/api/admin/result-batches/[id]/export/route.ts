import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'
import { canAccessAdminArea } from '@/lib/permissions'
import { logStaffAction } from '@/lib/staffAudit'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const batch = await prisma.resultBatch.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { username: true } },
      rows: {
        include: {
          account: {
            select: {
              username: true,
              title: true,
              category: { select: { name: true } },
              seller: { select: { username: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  const format = req.nextUrl.searchParams.get('format') || 'all'
  const workbook = xlsx.utils.book_new()
  const dateStr = new Date(batch.createdAt).toISOString().split('T')[0]

  const allRows = batch.rows.map((row, index) => ({
    No: index + 1,
    Seller: row.account?.seller?.username || '-',
    Seller_Email: row.account?.seller?.email || '-',
    Seller_Phone: row.account?.seller?.phone || '-',
    Platform: row.account?.category?.name || '-',
    Account: row.account?.username || row.username,
    Status: row.status,
    Previous_Status: row.previousStatus || '-',
    Price_BDT: row.price,
    Reason: row.reason || '-',
    Credited: row.credited ? 'Yes' : 'No',
    Pending_Payout: row.pending ? 'Yes' : 'No',
  }))

  if (format === 'all' || format === 'summary') {
    const summarySheet = xlsx.utils.aoa_to_sheet([
      ['Batch', batch.fileName],
      ['Applied At', new Date(batch.createdAt).toLocaleString('en-BD')],
      ['Admin', batch.admin.username],
      ['Status', batch.status],
      ['Credit Mode', batch.creditMode],
      ['Total Rows', batch.totalRows],
      ['Matched', batch.matchedRows],
      ['Valid', batch.validRows],
      ['Invalid', batch.invalidRows],
      ['Review', batch.reviewRows],
      ['Credited BDT', batch.creditedAmount],
      ['Pending BDT', batch.pendingAmount],
      ['Note', batch.note || '-'],
    ])
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  }

  if (format === 'all' || format === 'flat') {
    const flatSheet = xlsx.utils.json_to_sheet(allRows)
    xlsx.utils.book_append_sheet(workbook, flatSheet, 'All Rows')
  }

  if (format === 'all' || format === 'seller') {
    const bySeller = new Map<string, typeof allRows>()
    for (const row of allRows) {
      const key = row.Seller
      const list = bySeller.get(key) || []
      list.push(row)
      bySeller.set(key, list)
    }

    for (const [seller, rows] of Array.from(bySeller.entries())) {
      const sheetName = `${seller}`.slice(0, 31).replace(/[\\/?*[\]]/g, '_') || 'Unknown'
      const sheet = xlsx.utils.json_to_sheet(rows)
      xlsx.utils.book_append_sheet(workbook, sheet, sheetName)
    }
  }

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const safeName = batch.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 40)
  await logStaffAction(user, 'export.result_batch', 'resultBatch', batch.id, { format, rows: batch.rows.length, fileName: batch.fileName }, req)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="premiumx_result_${safeName}_${dateStr}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
