import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import * as xlsx from 'xlsx'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const formData = await req.formData()
    const categoryId = formData.get('categoryId') as string
    const file = formData.get('file') as File

    if (!categoryId || !file) {
      return NextResponse.json({ error: 'Missing category or file' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel/CSV
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json<any>(sheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'The file is empty' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 accounts can be uploaded at once' }, { status: 400 })
    }

    const accountsData = rows.map((row: any) => {
      // Handle different possible column names (case-insensitive mapping)
      const getVal = (keys: string[]) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(k.toLowerCase().trim())) return String(row[k])
        }
        return ''
      }

      const username = getVal(['username', 'email', 'user', 'account'])
      const password = getVal(['password', 'pass', 'pw'])
      const twoFA = getVal(['2fa', 'twofa', 'secret', '2fa secret'])

      if (!username || !password) return null

      return {
        sellerId: authUser.userId,
        categoryId: category.id,
        title: `${category.name} Account`,
        username: username,
        password: password,
        twoFASecret: twoFA || null,
        price: category.defaultPrice,
        status: 'pending'
      }
    }).filter(Boolean)

    if (accountsData.length === 0) {
      return NextResponse.json({ error: 'Could not find Username and Password columns in the file' }, { status: 400 })
    }

    // Insert accounts in bulk
    await prisma.account.createMany({
      data: accountsData
    })

    return NextResponse.json({ 
      success: true, 
      count: accountsData.length 
    })

  } catch (error: any) {
    console.error('Bulk Sell API error:', error)
    return NextResponse.json({ error: 'Failed to process file. Make sure it is a valid Excel or CSV.' }, { status: 500 })
  }
}
