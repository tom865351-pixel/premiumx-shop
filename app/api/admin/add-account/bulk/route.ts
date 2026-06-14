import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseAccountExcel } from '@/lib/accountExcel'

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
    const parsed = parseAccountExcel(Buffer.from(buffer))
    const rows = parsed.rows

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found. Use Username and Password columns, or first column username and second column password.' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Max 500 accounts per upload.' }, { status: 400 })
    }

    const accounts = []
    for (const row of rows) {
      accounts.push({
        sellerId: authUser.userId,
        categoryId,
        title: `${category.name} Account`,
        username: row.username,
        password: row.password,
        twoFASecret: row.twoFA || null,
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
