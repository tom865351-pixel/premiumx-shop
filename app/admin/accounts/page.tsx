import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AdminAccountsClient from './AdminAccountsClient'
import { getSetting } from '@/lib/settings'

export default async function AdminAccounts() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, seller: true }
  })

  const rejectTemplates = await getSetting('reject_templates')

  return <AdminAccountsClient accounts={accounts} rejectTemplates={rejectTemplates} />
}
