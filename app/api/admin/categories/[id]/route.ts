import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'categories'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { accounts: true } } },
  })

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  if (category._count.accounts > 0) {
    return NextResponse.json(
      { error: `This category has ${category._count.accounts} account(s). Disable it instead, or move/delete those accounts first.` },
      { status: 400 }
    )
  }

  await prisma.category.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
