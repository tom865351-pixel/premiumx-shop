import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AdminAddAccountClient from './AdminAddAccountClient'

export default async function AdminAddAccountPage() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'admin') redirect('/login')

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return <AdminAddAccountClient categories={categories} />
}
