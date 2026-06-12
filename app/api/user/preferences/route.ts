import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { preferredCurrency, preferredLanguage } = data

    const updateData: any = {}
    if (preferredCurrency) updateData.preferredCurrency = preferredCurrency
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage

    await prisma.user.update({
      where: { id: user.userId },
      data: updateData
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
