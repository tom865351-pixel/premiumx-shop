import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string || '🌐'
  const color = formData.get('color') as string || '#9333EA'
  const description = formData.get('description') as string || ''
  const defaultPrice = parseFloat(formData.get('defaultPrice') as string || '0')

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  await prisma.category.create({
    data: {
      name,
      icon,
      color,
      description,
      defaultPrice,
    },
  })

  return NextResponse.redirect(new URL('/admin/categories', req.url))
}
