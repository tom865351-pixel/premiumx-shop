import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const categoryId = formData.get('categoryId') as string

    if (!file || !categoryId) {
      return NextResponse.json({ error: 'File and category required.' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file.' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Max 500 accounts per upload.' }, { status: 400 })
    }

    const accounts = []
    for (const row of rows) {
      const username = String(row['Username'] || row['username'] || row['Email'] || row['email'] || '').trim()
      const password = String(row['Password'] || row['password'] || '').trim()
      const twoFA = String(row['2FA'] || row['twofa'] || row['TwoFA'] || row['2fa'] || '').trim()

      if (!username || !password) continue

      accounts.push({
        sellerId: authUser.userId,
        categoryId,
        title: `${category.name} Account`,
        username,
        password,
        twoFASecret: twoFA || null,
        price: (category as any).defaultPrice || 0,
        status: 'approved', // Admin bulk = auto approved and live
      })
    }

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No valid accounts found. Check column names: Username, Password, 2FA' }, { status: 400 })
    }

    await prisma.account.createMany({ data: accounts })

    return NextResponse.json({ success: true, count: accounts.length })
  } catch (error: any) {
    console.error('Admin bulk add error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
