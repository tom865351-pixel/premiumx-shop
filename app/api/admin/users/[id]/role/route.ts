import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()
    
    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role }
    })

    return NextResponse.json({ success: true, role: updatedUser.role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
