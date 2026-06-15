import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'
import { canAccessAdminArea } from '@/lib/permissions'

type IncomingRow = {
  accountId?: string
  username?: string
  status: 'valid' | 'invalid' | 'review' | 'unmatched'
  reason?: string
  rowNumber?: number
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const rows = (body.rows || []) as IncomingRow[]
  const creditMode = body.creditMode === 'pending' ? 'pending' : 'instant'
  const autoCredit = body.autoCredit !== false
  const reasonMode = body.reasonMode === 'row' ? 'row' : 'same'
  const defaultReason = String(body.defaultReason || 'Invalid or not working account')
  const fileName = String(body.fileName || 'result.xlsx')
  const fileHash = String(body.fileHash || '')
  const note = String(body.note || '')

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No preview rows to apply' }, { status: 400 })
  }

  if (fileHash) {
    let existing = null
    try {
      existing = await prisma.resultBatch.findFirst({ where: { fileHash, status: { not: 'rolled_back' } } })
    } catch (error) {
      if (isMissingResultBatchTables(error)) {
        return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
      }
      throw error
    }
    if (existing) return NextResponse.json({ error: 'This result file was already applied.' }, { status: 400 })
  }

  const ids = rows.map((row) => row.accountId).filter(Boolean) as string[]
  const usernames = rows.map((row) => row.username).filter(Boolean) as string[]
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        ids.length ? { id: { in: ids } } : undefined,
        usernames.length ? { username: { in: usernames } } : undefined,
      ].filter(Boolean) as any,
    },
    include: { seller: true },
  })
  const byId = new Map(accounts.map((account) => [account.id, account]))
  const byUsername = new Map(accounts.map((account) => [account.username.toLowerCase(), account]))
  let alreadyCreditedRows: { accountId: string | null }[] = []
  try {
    alreadyCreditedRows = await prisma.resultRow.findMany({
      where: {
        accountId: { in: accounts.map((account) => account.id) },
        credited: true,
      },
      select: { accountId: true },
    })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }
  const alreadyCreditedIds = new Set(alreadyCreditedRows.map((row) => row.accountId).filter(Boolean))

  let summary
  try {
    summary = await prisma.$transaction(async (tx) => {
    const batch = await tx.resultBatch.create({
      data: {
        adminId: user.userId,
        fileName,
        fileHash: fileHash || null,
        creditMode: autoCredit ? creditMode : 'report_only',
        reasonMode,
        defaultReason,
        note,
        totalRows: rows.length,
      },
    })

    const sellerSummary = new Map<string, { sellerId: string; valid: number; invalid: number; review: number; amount: number; pending: number }>()
    let matchedRows = 0
    let validRows = 0
    let invalidRows = 0
    let reviewRows = 0
    let creditedAmount = 0
    let pendingAmount = 0

    for (const row of rows) {
      const account = (row.accountId && byId.get(row.accountId)) || (row.username ? byUsername.get(row.username.toLowerCase()) : undefined)
      const status = account ? row.status : 'unmatched'
      const reason = reasonMode === 'row' ? (row.reason || defaultReason) : defaultReason
      const previousStatus = account?.status
      const wasAlreadyCredited = Boolean(account?.id && alreadyCreditedIds.has(account.id))
      const canProcess = autoCredit && account && account.status === 'pending' && !wasAlreadyCredited

      if (account) matchedRows += 1
      if (status === 'valid') validRows += 1
      if (status === 'invalid') invalidRows += 1
      if (status === 'review') reviewRows += 1

      let credited = false
      let pending = false

      if (canProcess && status === 'valid') {
        await tx.account.update({ where: { id: account.id }, data: { status: 'approved' } })
        if (creditMode === 'instant') {
          const updatedSeller = await tx.user.update({
            where: { id: account.sellerId },
            data: { balance: { increment: account.price } },
          })
          await tx.transaction.create({
            data: {
              userId: account.sellerId,
              type: 'sale',
              amount: account.price,
              balance: updatedSeller.balance,
              description: `Bulk result approved: ${account.title}${note ? ` (${note})` : ''}`,
            },
          })
          credited = true
          creditedAmount += account.price
        } else {
          pending = true
          pendingAmount += account.price
        }
      } else if (canProcess && status === 'invalid') {
        await tx.account.update({ where: { id: account.id }, data: { status: 'rejected' } })
      }

      if (account) {
        const current = sellerSummary.get(account.sellerId) || { sellerId: account.sellerId, valid: 0, invalid: 0, review: 0, amount: 0, pending: 0 }
        if (status === 'valid') current.valid += 1
        if (status === 'invalid') current.invalid += 1
        if (status === 'review') current.review += 1
        if (credited) current.amount += account.price
        if (pending) current.pending += account.price
        sellerSummary.set(account.sellerId, current)
      }

      await tx.resultRow.create({
        data: {
          batchId: batch.id,
          accountId: account?.id,
          sellerId: account?.sellerId,
          username: account?.username || row.username || row.accountId || `row-${row.rowNumber || ''}`,
          status,
          previousStatus,
          price: account?.price || 0,
          reason: wasAlreadyCredited ? 'Skipped: account was already credited in a previous result batch' : status === 'invalid' ? reason : row.reason || null,
          credited,
          pending,
        },
      })
    }

    for (const item of Array.from(sellerSummary.values())) {
      await tx.notification.create({
        data: {
          userId: item.sellerId,
          title: 'Bulk result report ready',
          message: autoCredit
            ? `${item.valid} valid, ${item.invalid} rejected, ${item.review} review. ${creditMode === 'instant' ? `BDT ${item.amount} credited.` : `BDT ${item.pending} pending payout.`}`
            : `${item.valid} valid, ${item.invalid} rejected, ${item.review} review. Admin has not applied wallet/status changes yet.`,
          type: item.invalid ? 'warning' : 'success',
          link: '/orders',
        },
      })
    }

    await tx.resultBatch.update({
      where: { id: batch.id },
      data: { matchedRows, validRows, invalidRows, reviewRows, creditedAmount, pendingAmount },
    })

    return { batchId: batch.id, matchedRows, validRows, invalidRows, reviewRows, creditedAmount, pendingAmount }
    })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }

  return NextResponse.json({ success: true, ...summary })
}
