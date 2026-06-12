import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import SellForm from './SellForm'
import Navbar from '@/components/layout/Navbar'

export default async function SellPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  // Optional: Only allow sellers to access this page
  // if (user.role !== 'seller' && user.role !== 'admin') {
  //   return <div>You don't have permission to sell. Contact admin to upgrade your account.</div>
  // }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 800 }}>
        <div className="page-header" style={{ marginBottom: 30, textAlign: 'center' }}>
          <h1 className="page-title">Sell Digital Accounts</h1>
          <p className="page-subtitle" style={{ maxWidth: 600, margin: '10px auto 0' }}>
            List your premium accounts on our marketplace. You can upload them one by one, or use the bulk excel upload feature.
          </p>
        </div>

        <SellForm categories={categories} />
      </main>
    </div>
  )
}
