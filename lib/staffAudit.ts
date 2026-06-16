import { NextRequest } from 'next/server'
import prisma from './prisma'

let ensured = false

async function ensureAuditTable() {
  if (ensured) return
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "StaffAuditLog" (
      "id" TEXT PRIMARY KEY,
      "staffId" TEXT,
      "staffRole" TEXT,
      "action" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT,
      "details" JSONB,
      "ip" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StaffAuditLog_createdAt_idx" ON "StaffAuditLog"("createdAt")`
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StaffAuditLog_staffId_idx" ON "StaffAuditLog"("staffId")`
  ensured = true
}

export async function logStaffAction(
  staff: { userId: string; role: string } | null,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, unknown>,
  req?: NextRequest | Request,
) {
  try {
    await ensureAuditTable()
    await prisma.$executeRaw`
      INSERT INTO "StaffAuditLog" ("id", "staffId", "staffRole", "action", "targetType", "targetId", "details", "ip", "userAgent")
      VALUES (
        ${crypto.randomUUID()},
        ${staff?.userId || null},
        ${staff?.role || null},
        ${action},
        ${targetType},
        ${targetId || null},
        ${JSON.stringify(details || {})}::jsonb,
        ${req?.headers.get('x-forwarded-for') || null},
        ${req?.headers.get('user-agent') || null}
      )
    `
  } catch (error) {
    console.error('Staff audit log failed', error)
  }
}

export async function getRecentStaffAuditLogs(limit = 30) {
  try {
    await ensureAuditTable()
    return await prisma.$queryRawUnsafe<Array<{
      id: string
      staffId: string | null
      staffRole: string | null
      action: string
      targetType: string
      targetId: string | null
      details: any
      createdAt: Date
    }>>(
      `SELECT "id", "staffId", "staffRole", "action", "targetType", "targetId", "details", "createdAt"
       FROM "StaffAuditLog"
       ORDER BY "createdAt" DESC
       LIMIT ${Math.max(1, Math.min(100, limit))}`,
    )
  } catch {
    return []
  }
}
