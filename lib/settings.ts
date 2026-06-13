import prisma from './prisma'

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'PremiumX Shop',
  site_logo: '',
  maintenance_mode: 'false',
  commission_rate: '10',
  report_window_hours: '48',
  min_topup_bdt: '100',
  bkash_number: '01XXXXXXXXX',
  nagad_number: '01XXXXXXXXX',
  rocket_number: '01XXXXXXXXX',
  crypto_wallet: 'TXXXXXXXXXXXXXXXXXXXXXXXx',
  usd_rate: '110',
  usdt_rate: '110',
  contact_email: 'support@premiumx.shop',
  contact_telegram: '@premiumxshop',
  maintenance_message: 'PremiumX is being updated. Please check again soon.',
  homepage_badges: 'Admin reviewed stock,Wallet payout tracking,Excel bulk submit',
  homepage_hero_badge: 'PremiumX buys verified digital accounts from sellers',
  homepage_hero_title: 'Sell Your Digital Accounts',
  homepage_hero_highlight: 'Get Paid After Admin Review',
  homepage_hero_subtitle: 'Submit Instagram, Facebook, Gmail, TikTok and other accounts one by one or by Excel upload. Admin reviews the stock, buys valid accounts, and your wallet balance updates.',
  live_resources: 'Instagram account opening class recording|/live\nSeller rules and payout guide|/support',
  subadmin_permissions: '{"users":false,"accounts":true,"payouts":false,"support":true,"settings":false}',
  reject_templates: 'Wrong password\nDuplicate account\nIncomplete recovery info\nInvalid account details',
  support_reply_templates: 'Thanks for contacting PremiumX. We are checking this now.\nPlease send your transaction ID and payment method.\nYour issue has been solved. We are closing this ticket.',
  fraud_rules: '{"duplicateLogin":true,"repeatedPayout":true,"missingRecovery":true,"highRejectRate":40}',
  payout_min_bdt: '100',
  payout_limit_daily_bdt: '50000',
  next_payout_time: 'Every day at 10:00 PM',
}

export async function getSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key } })
    return setting?.value ?? DEFAULT_SETTINGS[key] ?? ''
  } catch {
    return DEFAULT_SETTINGS[key] ?? ''
  }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: keys } },
    })
    const result: Record<string, string> = {}
    for (const key of keys) {
      const found = settings.find(s => s.key === key)
      result[key] = found?.value ?? DEFAULT_SETTINGS[key] ?? ''
    }
    return result
  } catch {
    const result: Record<string, string> = {}
    for (const key of keys) result[key] = DEFAULT_SETTINGS[key] ?? ''
    return result
  }
}

export async function setSetting(key: string, value: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}
