import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function DepositSuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      
      <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="card card-glass" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: 40, borderTop: '4px solid var(--success)' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 28, marginBottom: 16, color: 'var(--success)' }}>Payment Successful!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 16 }}>
            Your deposit via ZiniPay was successful. The balance has been instantly added to your wallet!
          </p>
          
          {searchParams.tx_id && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 32 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Transaction ID:</span>
              <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)', marginTop: 4 }}>{searchParams.tx_id}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/wallet" className="btn btn-blue">Go to Wallet</Link>
            <Link href="/browse" className="btn btn-gold">Buy Accounts</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
