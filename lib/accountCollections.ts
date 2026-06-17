import prisma from './prisma'

export type AccountCollectionBatch = {
  id: string
  adminId: string | null
  categoryId: string
  categoryName: string
  mode: string
  statusFilter: string
  accountCount: number
  fileName: string
  createdAt: Date
}

let ensured = false

export async function ensureAccountCollectionTables() {
  if (ensured) return

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "AccountCollectionBatch" (
      "id" TEXT PRIMARY KEY,
      "adminId" TEXT,
      "categoryId" TEXT NOT NULL,
      "categoryName" TEXT NOT NULL,
      "mode" TEXT NOT NULL,
      "statusFilter" TEXT NOT NULL,
      "accountCount" INTEGER NOT NULL DEFAULT 0,
      "fileName" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "AccountCollectionItem" (
      "id" TEXT PRIMARY KEY,
      "batchId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AccountCollectionBatch_categoryId_createdAt_idx" ON "AccountCollectionBatch"("categoryId", "createdAt")`
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AccountCollectionItem_accountId_idx" ON "AccountCollectionItem"("accountId")`
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AccountCollectionItem_batchId_idx" ON "AccountCollectionItem"("batchId")`

  ensured = true
}

export async function getAccountCollectionBatches(limit = 30) {
  await ensureAccountCollectionTables()
  return prisma.$queryRawUnsafe<AccountCollectionBatch[]>(
    `SELECT "id", "adminId", "categoryId", "categoryName", "mode", "statusFilter", "accountCount", "fileName", "createdAt"
     FROM "AccountCollectionBatch"
     ORDER BY "createdAt" DESC
     LIMIT ${Math.max(1, Math.min(100, limit))}`,
  )
}

export async function getNewAccountCountsByCategory(status = 'pending') {
  await ensureAccountCollectionTables()
  const validStatuses = ['pending', 'approved', 'rejected', 'sold', 'all']
  const statusFilter = validStatuses.includes(status) ? status : 'pending'
  const statusSql = statusFilter === 'all' ? '' : `AND a."status" = '${statusFilter}'`

  return prisma.$queryRawUnsafe<Array<{
    categoryId: string
    categoryName: string
    totalCount: number
    newCount: number
  }>>(
    `SELECT
       c."id" AS "categoryId",
       c."name" AS "categoryName",
       COUNT(a."id")::int AS "totalCount",
       COUNT(a."id") FILTER (
         WHERE NOT EXISTS (
           SELECT 1 FROM "AccountCollectionItem" i WHERE i."accountId" = a."id"
         )
       )::int AS "newCount"
     FROM "Category" c
     LEFT JOIN "Account" a ON a."categoryId" = c."id" ${statusSql}
     GROUP BY c."id", c."name"
     ORDER BY c."name" ASC`,
  )
}

export async function getBatch(id: string) {
  await ensureAccountCollectionTables()
  const rows = await prisma.$queryRaw<AccountCollectionBatch[]>`
    SELECT "id", "adminId", "categoryId", "categoryName", "mode", "statusFilter", "accountCount", "fileName", "createdAt"
    FROM "AccountCollectionBatch"
    WHERE "id" = ${id}
    LIMIT 1
  `
  return rows[0] || null
}
