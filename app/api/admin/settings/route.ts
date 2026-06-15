import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { stringifyPermissions } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  if (formData.get('permissions_form') === '1') {
    formData.set('subadmin_permissions', stringifyPermissions(formData, 'subadmin'))
    formData.set('stockmanager_permissions', stringifyPermissions(formData, 'stockmanager'))
  }

  const keys = [
    'site_name', 'commission_rate', 'report_window_hours', 'min_topup_bdt',
    'bkash_number', 'nagad_number', 'rocket_number', 'crypto_wallet', 'usd_rate', 'usdt_rate',
    'maintenance_mode', 'maintenance_message', 'contact_email', 'contact_telegram',
    'homepage_badges', 'homepage_hero_badge', 'homepage_hero_title', 'homepage_hero_highlight',
    'homepage_hero_subtitle', 'live_resources', 'reject_templates', 'support_reply_templates',
    'fraud_rules', 'payout_min_bdt', 'payout_limit_daily_bdt', 'next_payout_time',
    'subadmin_permissions', 'stockmanager_permissions', 'bulk_result_auto_credit', 'bulk_result_credit_mode',
    'bulk_result_reason_mode', 'bulk_result_default_reason', 'bulk_result_allow_color'
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
