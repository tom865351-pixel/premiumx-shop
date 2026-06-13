import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { categoryId, username, password, twoFASecret, description, followersCount, accountAge, status } = data

    if (!categoryId || !username || !password) {
      return NextResponse.json({ error: 'Category, username and password are required.' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const account = await prisma.account.create({
      data: {
        sellerId: authUser.userId,
        categoryId,
        title: `${category.name} Account`,
        username,
        password,
        twoFASecret: twoFASecret || null,
        description: description || null,
        followersCount: followersCount ? parseInt(followersCount) : 0,
        accountAge: accountAge || null,
        price: (category as any).defaultPrice || 0,
        status: status === 'approved' ? 'approved' : 'approved', // Admin adds = auto approved
      }
    })

    return NextResponse.json({ success: true, account })
  } catch (error: any) {
    console.error('Admin add account error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
