import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const data = await req.json()
    const { 
      categoryId, title, username, password, twoFASecret, recoveryEmail, recoveryPhone, accountAge, proofLink
    } = data

    if (!categoryId || !title || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Insert account
    const account = await prisma.account.create({
      data: {
        sellerId: authUser.userId,
        categoryId,
        title,
        username,
        password,
        twoFASecret: twoFASecret || null,
        recoveryEmail: recoveryEmail || null,
        recoveryPhone: recoveryPhone || null,
        accountAge: accountAge || null,
        screenshots: proofLink ? JSON.stringify([proofLink]) : '[]',
        price: (category as any).defaultPrice || 0,
        status: 'pending' // Admin needs to approve
      }
    })

    return NextResponse.json({ success: true, account })

  } catch (error: any) {
    console.error('Sell API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
