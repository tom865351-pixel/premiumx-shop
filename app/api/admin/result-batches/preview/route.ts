import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { hashBuffer, parseResultWorkbook } from '@/lib/bulkResults'
import { isMissingResultBatchTables, RESULT_BATCH_SETUP_MESSAGE } from '@/lib/prismaErrors'
import { fetchPublicSheetBuffer } from '@/lib/sheetLinks'
import { canAccessAdminArea } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'results'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const sheetUrl = String(form.get('sheetUrl') || '').trim()
  if (!file?.size && !sheetUrl) return NextResponse.json({ error: 'Excel file or public Sheet link is required' }, { status: 400 })
  const requestedFallback = String(form.get('unknownStatus') || 'review')
  const unknownStatus = ['valid', 'invalid', 'review'].includes(requestedFallback) ? requestedFallback as 'valid' | 'invalid' | 'review' : 'review'

  const buffer = sheetUrl ? await fetchPublicSheetBuffer(sheetUrl) : Buffer.from(await file!.arrayBuffer())
  const hash = hashBuffer(buffer)
  const settings = await getSettings(['bulk_result_allow_color'])
  const parsed = await parseResultWorkbook(buffer, settings.bulk_result_allow_color !== 'false', unknownStatus)
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
    fileName: sheetUrl ? 'sheet-link-result.xlsx' : file!.name,
    fileHash: hash,
    totalRows: rows.length,
    matchedRows: rows.filter((row) => row.matched).length,
    rows,
  })
}
