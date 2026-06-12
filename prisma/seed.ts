import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@premiumx.shop' },
    update: {},
    create: {
      email: 'admin@premiumx.shop',
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      balance: 0,
    },
  })
  console.log('Admin created:', admin.email)

  // Create default categories
  const categories = [
    { name: 'Instagram', icon: '📸', color: '#E1306C', sortOrder: 1 },
    { name: 'Facebook', icon: '📘', color: '#1877F2', sortOrder: 2 },
    { name: 'Gmail / Google', icon: '📧', color: '#EA4335', sortOrder: 3 },
    { name: 'TikTok', icon: '🎵', color: '#010101', sortOrder: 4 },
    { name: 'Twitter / X', icon: '🐦', color: '#1DA1F2', sortOrder: 5 },
    { name: 'YouTube', icon: '▶️', color: '#FF0000', sortOrder: 6 },
    { name: 'Telegram', icon: '✈️', color: '#26A5E4', sortOrder: 7 },
    { name: 'Discord', icon: '💬', color: '#5865F2', sortOrder: 8 },
    { name: 'Snapchat', icon: '👻', color: '#FFFC00', sortOrder: 9 },
    { name: 'LinkedIn', icon: '💼', color: '#0A66C2', sortOrder: 10 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log('Categories created')

  // Default settings
  const settings = [
    { key: 'site_name', value: 'PremiumX Shop' },
    { key: 'commission_rate', value: '10' },
    { key: 'report_window_hours', value: '48' },
    { key: 'min_topup_bdt', value: '100' },
    { key: 'bkash_number', value: '01XXXXXXXXX' },
    { key: 'nagad_number', value: '01XXXXXXXXX' },
    { key: 'crypto_wallet', value: 'TXXXXXXXXXXXXXXXXXXXXXXXx' },
    { key: 'usd_rate', value: '110' },
    { key: 'usdt_rate', value: '110' },
    { key: 'maintenance_mode', value: 'false' },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }
  console.log('Settings created')
  console.log('\n✅ Seed complete!')
  console.log('Admin login: admin@premiumx.shop / admin123456')
}

main().catch(console.error).finally(() => prisma.$disconnect())
