import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { canAccessAdminArea } from '@/lib/permissions'
import { ensureAccountCollectionTables } from '@/lib/accountCollections'
import { buildCollectionWorkbook, type CollectionExportAccount } from '@/lib/accountCollectionExport'
import { logStaffAction } from '@/lib/staffAudit'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'sold', 'all']
const VALID_MODES = ['new', 'all']

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'accounts'
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'accounts'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureAccountCollectionTables()

  const formData = await req.formData()
  const categoryId = String(formData.get('categoryId') || '')
  const mode = String(formData.get('mode') || 'new')
  const status = String(formData.get('status') || 'pending')

  if (!categoryId || !VALID_MODES.includes(mode) || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid collection request' }, { status: 400 })
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const collectedRows = mode === 'new'
    ? await prisma.$queryRaw<Array<{ accountId: string }>>`
        SELECT DISTINCT "accountId" FROM "AccountCollectionItem" WHERE "categoryId" = ${categoryId}
      `
    : []
  const collectedIds = collectedRows.map((row) => row.accountId)

  const accounts = await prisma.account.findMany({
    where: {
      categoryId,
      ...(status === 'all' ? {} : { status }),
      ...(mode === 'new'
        ? {
            NOT: {
              id: { in: collectedIds },
            },
          }
        : {}),
    },
    include: {
      category: { select: { name: true } },
      seller: { select: { username: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'asc' },
  }) as CollectionExportAccount[]

  const batchId = crypto.randomUUID()
  const datePart = new Date().toISOString().slice(0, 10)
  const fileName = `premiumx_${safeSegment(category.name)}_${mode}_${status}_${accounts.length}pcs_${datePart}.xlsx`

  await prisma.$executeRaw`
    INSERT INTO "AccountCollectionBatch" ("id", "adminId", "categoryId", "categoryName", "mode", "statusFilter", "accountCount", "fileName")
    VALUES (${batchId}, ${user.userId}, ${category.id}, ${category.name}, ${mode}, ${status}, ${accounts.length}, ${fileName})
  `

  for (const account of accounts) {
    await prisma.$executeRaw`
      INSERT INTO "AccountCollectionItem" ("id", "batchId", "accountId", "categoryId")
      VALUES (${crypto.randomUUID()}, ${batchId}, ${account.id}, ${category.id})
    `
  }

  await logStaffAction(user, 'export.account_collection', 'accountCollectionBatch', batchId, {
    categoryId,
    categoryName: category.name,
    mode,
    status,
    count: accounts.length,
    fileName,
  }, req)

  const buffer = buildCollectionWorkbook(accounts, { categoryName: category.name, mode, status, batchId })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
