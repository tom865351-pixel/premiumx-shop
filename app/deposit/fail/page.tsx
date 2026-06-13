import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function DepositFailPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const authUser = await getAuthUser()
  const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.userId } }) : null
  const txId = Array.isArray(searchParams.tx_id) ? searchParams.tx_id[0] : searchParams.tx_id

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />

      <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px 110px' }}>
        <div className="card card-glass" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: 34, borderTop: '4px solid var(--danger)', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 900, marginBottom: 10 }}>PAYMENT NOT COMPLETED</div>
          <h1 style={{ fontSize: 28, marginBottom: 14, color: 'var(--danger)' }}>Payment Failed</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 22, fontSize: 15, lineHeight: 1.7 }}>
            The payment was cancelled or could not be confirmed. If money was deducted, open a support ticket with your transaction ID.
          </p>

          {txId && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 26 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Transaction ID</span>
              <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)', marginTop: 4, wordBreak: 'break-word' }}>{txId}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/wallet" className="btn btn-outline">Try Again</Link>
            <Link href="/support/new" className="btn btn-blue">Contact Support</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
