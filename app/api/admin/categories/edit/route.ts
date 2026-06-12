import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const icon = formData.get('icon') as string
    const color = formData.get('color') as string
    const description = formData.get('description') as string
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string || '0')

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.category.update({
      where: { id },
      data: { name, icon, color, description, defaultPrice }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
