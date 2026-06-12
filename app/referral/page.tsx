import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function generateReferralCode(username: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${username.toUpperCase().slice(0, 4)}${random}`
}

export default async function ReferralPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  let user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  // Auto-generate referral code if not set
  if (!user.referralCode) {
    const code = generateReferralCode(user.username)
    user = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code }
    })
  }

  // Leaderboard — top referrers
  const leaderboard = await prisma.user.findMany({
    where: { referralCount: { gt: 0 } },
    orderBy: { referralCount: 'desc' },
    take: 10,
    select: { username: true, referralCount: true, referralEarnings: true }
  })

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://premiumx-shop.vercel.app'}/register?ref=${user.referralCode}`
  const myRank = leaderboard.findIndex(u => u.username === user!.username) + 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user as any} />
      <main className="container" style={{ padding: '40px 20px', flex: 1, maxWidth: 900 }}>

        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 Referral Program</h1>
            <p className="page-subtitle">Invite friends and earn bonus balance for every successful signup!</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32, gap: 20 }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>{user.referralCount}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>People Referred</div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>৳{user.referralEarnings.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Earned</div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple)' }}>
              {myRank > 0 ? `#${myRank}` : '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your Rank</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="card card-glass" style={{ padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔗 Your Referral Link</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 14, color: 'var(--gold)', wordBreak: 'break-all' }}>
              {referralLink}
            </div>
            <button
              className="btn btn-gold"
              onClick={undefined}
              id="copy-referral-btn"
              style={{ whiteSpace: 'nowrap' }}
            >
              📋 Copy Link
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
            🎁 <strong style={{ color: 'var(--gold)' }}>You earn ৳50 bonus</strong> for every friend who registers and makes their first purchase!
          </p>
        </div>

        {/* Leaderboard */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>🏆 Referral Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
            <div>Be the first to refer someone and top the leaderboard!</div>
          </div>
        ) : (
          <div className="table-container card">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Referrals</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr key={entry.username} style={entry.username === user!.username ? { background: 'rgba(212,175,55,0.05)' } : {}}>
                    <td>
                      <span style={{ fontSize: 20 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: entry.username === user!.username ? 700 : 400 }}>
                      @{entry.username}
                      {entry.username === user!.username && <span style={{ color: 'var(--gold)', fontSize: 12, marginLeft: 6 }}>(You)</span>}
                    </td>
                    <td>{entry.referralCount} people</td>
                    <td className="text-gold font-mono">৳{entry.referralEarnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('copy-referral-btn')?.addEventListener('click', function() {
          navigator.clipboard.writeText('${referralLink}').then(() => {
            this.textContent = '✅ Copied!';
            setTimeout(() => { this.textContent = '📋 Copy Link'; }, 2000);
          });
        });
      `}} />
    </div>
  )
}
