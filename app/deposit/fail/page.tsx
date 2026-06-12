import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function DepositFailPage() {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="card card-glass" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: 40, borderTop: '4px solid var(--danger)' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
          <h1 style={{ fontSize: 28, marginBottom: 16, color: 'var(--danger)' }}>Payment Failed</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>
            Unfortunately, your deposit could not be processed. If money was deducted, please open a support ticket.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/deposit" className="btn btn-outline">Try Again</Link>
            <Link href="/support" className="btn btn-blue">Contact Support</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
