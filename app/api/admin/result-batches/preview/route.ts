import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { hashBuffer, parseResultWorkbook } from '@/lib/bulkResults'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = hashBuffer(buffer)
  const settings = await getSettings(['bulk_result_allow_color'])
  const parsed = parseResultWorkbook(buffer, settings.bulk_result_allow_color !== 'false')
  const ids = parsed.map((row) => row.accountId).filter(Boolean)
  const usernames = parsed.map((row) => row.username).filter(Boolean)

  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        ids.length ? { id: { in: ids } } : undefined,
        usernames.length ? { username: { in: usernames } } : undefined,
      ].filter(Boolean) as any,
    },
    include: { seller: { select: { username: true, email: true } }, category: { select: { name: true } } },
  })

  const byId = new Map(accounts.map((account) => [account.id, account]))
  const byUsername = new Map(accounts.map((account) => [account.username.toLowerCase(), account]))
  let existingRows: { accountId: string | null }[] = []
  try {
    existingRows = await prisma.resultRow.findMany({
      where: { accountId: { in: accounts.map((account) => account.id) }, credited: true },
      select: { accountId: true },
    })
  } catch (error) {
    if (isMissingResultBatchTables(error)) {
      return NextResponse.json({ error: RESULT_BATCH_SETUP_MESSAGE }, { status: 503 })
    }
    throw error
  }
  const creditedIds = new Set(existingRows.map((row) => row.accountId))

  const rows = parsed.map((row) => {
    const account = (row.accountId && byId.get(row.accountId)) || byUsername.get(row.username.toLowerCase())
    return {
      ...row,
      accountId: account?.id || row.accountId,
      matched: Boolean(account),
      alreadyCredited: account ? creditedIds.has(account.id) : false,
      currentStatus: account?.status || 'unmatched',
      seller: account?.seller?.username || '',
      sellerEmail: account?.seller?.email || '',
      category: account?.category?.name || '',
      price: account?.price || 0,
      title: account?.title || '',
    }
  })

  return NextResponse.json({
    fileName: file.name,
    fileHash: hash,
    totalRows: rows.length,
    matchedRows: rows.filter((row) => row.matched).length,
    rows,
  })
}
