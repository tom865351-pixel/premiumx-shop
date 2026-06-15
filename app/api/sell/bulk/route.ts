import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { parseAccountExcel } from '@/lib/accountExcel'
import { findExistingAccounts, normalizeUsername } from '@/lib/duplicateAccount'
import { fetchPublicSheetBuffer } from '@/lib/sheetLinks'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const formData = await req.formData()
    const categoryId = formData.get('categoryId') as string
    const file = formData.get('file') as File | null
    const sheetUrl = String(formData.get('sheetUrl') || '').trim()

    if (!categoryId || (!file?.size && !sheetUrl)) {
      return NextResponse.json({ error: 'Missing category and Excel file or public Sheet link' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const buffer = sheetUrl
      ? await fetchPublicSheetBuffer(sheetUrl)
      : Buffer.from(await file!.arrayBuffer())

    const parsed = parseAccountExcel(buffer)
    const rows = parsed.rows

    if (rows.length === 0) {
      return NextResponse.json({
        error: parsed.skippedMissing > 0
          ? 'Could not read account rows. Put username in the first column and password in the second column, or use headers: Username, Password.'
          : 'The file is empty',
      }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 accounts can be uploaded at once' }, { status: 400 })
    }

    let missingRows = parsed.skippedMissing
    const seen = new Set<string>()
    let duplicateRows = 0

    const candidateUsernames = rows.map((row) => row.username).filter(Boolean)
    const existingAccounts = await findExistingAccounts(candidateUsernames, category.id)
    const existingUsernames = new Set(existingAccounts.map((account) => normalizeUsername(account.username)))

    const accountsData = rows.map((row) => {
      const duplicateKey = normalizeUsername(row.username)
      if (seen.has(duplicateKey) || existingUsernames.has(duplicateKey)) {
        duplicateRows += 1
        return null
      }
      seen.add(duplicateKey)

      return {
        sellerId: authUser.userId,
        categoryId: category.id,
        title: `${category.name} Account`,
        username: row.username,
        password: row.password,
        twoFASecret: row.twoFA || null,
        recoveryEmail: row.recoveryEmail || null,
        recoveryPhone: row.recoveryPhone || null,
        accountAge: row.accountAge || null,
        screenshots: row.proofLink ? JSON.stringify([row.proofLink]) : '[]',
        price: (category as any).defaultPrice || 0,
        status: 'pending'
      }
    }).filter(Boolean) as any[]

    if (accountsData.length === 0) {
      return NextResponse.json({ error: 'No valid accounts found. Use Username and Password columns, or first column username and second column password.' }, { status: 400 })
    }

    // Insert accounts in bulk
    await prisma.account.createMany({
      data: accountsData
    })

    return NextResponse.json({ 
      success: true, 
      count: accountsData.length,
      skippedMissing: missingRows,
      skippedDuplicates: duplicateRows,
      message: `Imported ${accountsData.length} accounts${sheetUrl ? ' from public Sheet link' : ''}. Skipped ${missingRows} missing rows and ${duplicateRows} duplicate rows.${parsed.headerFound ? '' : ' Used first two columns as username/password.'}`,
    })

  } catch (error: any) {
    console.error('Bulk Sell API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process file. Make sure it is a valid Excel, CSV, or public Sheet link.' }, { status: 500 })
  }
}
