import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import AdminAddAccountClient from './AdminAddAccountClient'
import { canAccessAdminArea } from '@/lib/permissions'

export default async function AdminAddAccountPage() {
  const authUser = await getAuthUser()
  if (!authUser || !(await canAccessAdminArea(authUser.role, 'addAccount'))) redirect('/login')

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return <AdminAddAccountClient categories={categories} />
}
