import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AdminAccountsClient from './AdminAccountsClient'

export default async function AdminAccounts() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, seller: true }
  })

  return <AdminAccountsClient accounts={accounts} />
}
