import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'
import { ensureAccountCollectionTables, getBatch } from '@/lib/accountCollections'
import { buildCollectionWorkbook, type CollectionExportAccount } from '@/lib/accountCollectionExport'
import { logStaffAction } from '@/lib/staffAudit'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'accounts'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureAccountCollectionTables()
  const batch = await getBatch(params.id)
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const itemRows = await prisma.$queryRaw<Array<{ accountId: string }>>`
    SELECT "accountId" FROM "AccountCollectionItem" WHERE "batchId" = ${params.id} ORDER BY "createdAt" ASC
  `
  const accountIds = itemRows.map((row) => row.accountId)

  const accounts = accountIds.length
    ? await prisma.account.findMany({
        where: { id: { in: accountIds } },
        include: {
          category: { select: { name: true } },
          seller: { select: { username: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'asc' },
      }) as CollectionExportAccount[]
    : []

  await logStaffAction(user, 'export.account_collection_redownload', 'accountCollectionBatch', params.id, {
    categoryId: batch.categoryId,
    categoryName: batch.categoryName,
    count: accounts.length,
    fileName: batch.fileName,
  }, req)

  const buffer = buildCollectionWorkbook(accounts, {
    categoryName: batch.categoryName,
    mode: batch.mode,
    status: batch.statusFilter,
    batchId: batch.id,
  })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${batch.fileName}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
