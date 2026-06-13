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
