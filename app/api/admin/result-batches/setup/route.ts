import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

const RESULT_BATCH_SETUP_SQL = [
  `CREATE TABLE IF NOT EXISTS "ResultBatch" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "creditMode" TEXT NOT NULL DEFAULT 'instant',
    "reasonMode" TEXT NOT NULL DEFAULT 'same',
    "defaultReason" TEXT,
    "note" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "matchedRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "reviewRows" INTEGER NOT NULL DEFAULT 0,
    "creditedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolledBackAt" TIMESTAMP(3),
    CONSTRAINT "ResultBatch_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ResultRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "accountId" TEXT,
    "sellerId" TEXT,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "previousStatus" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "credited" BOOLEAN NOT NULL DEFAULT false,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResultRow_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "adminId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "fileName" TEXT NOT NULL DEFAULT 'result.xlsx'`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "fileHash" TEXT`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'applied'`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "creditMode" TEXT NOT NULL DEFAULT 'instant'`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "reasonMode" TEXT NOT NULL DEFAULT 'same'`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "defaultReason" TEXT`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "note" TEXT`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "totalRows" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "matchedRows" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "validRows" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "invalidRows" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "reviewRows" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "creditedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "ResultBatch" ADD COLUMN IF NOT EXISTS "rolledBackAt" TIMESTAMP(3)`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "batchId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "accountId" TEXT`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "sellerId" TEXT`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "username" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'review'`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "previousStatus" TEXT`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "reason" TEXT`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "credited" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "pending" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "ResultRow" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `CREATE INDEX IF NOT EXISTS "ResultBatch_createdAt_idx" ON "ResultBatch"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ResultRow_batchId_idx" ON "ResultRow"("batchId")`,
  `CREATE INDEX IF NOT EXISTS "ResultRow_accountId_idx" ON "ResultRow"("accountId")`,
]

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    for (const sql of RESULT_BATCH_SETUP_SQL) {
      await prisma.$executeRawUnsafe(sql)
    }
  } catch (error) {
    console.error('Result batch setup failed', error)
    return NextResponse.json({ error: 'Could not create result upload database tables. Check DATABASE_URL and database permissions.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin/result-batches?setup=done', req.url))
}
