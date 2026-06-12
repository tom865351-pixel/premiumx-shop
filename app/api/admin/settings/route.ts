import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const keys = [
    'site_name', 'commission_rate', 'report_window_hours', 'min_topup_bdt',
    'bkash_number', 'nagad_number', 'crypto_wallet', 'usd_rate', 'usdt_rate',
    'maintenance_mode', 'contact_email', 'contact_telegram'
  ]

  for (const key of keys) {
    const value = formData.get(key) as string
    if (value !== null) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
  }

  return NextResponse.redirect(new URL('/admin/settings', req.url))
}
