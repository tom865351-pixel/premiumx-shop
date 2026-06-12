import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function SettingsPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (!user) redirect('/login')

  return (
    <div className="card" style={{ padding: 32 }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>General Profile</h1>
      
      <div className="grid-2" style={{ gap: 24 }}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="input" defaultValue={user?.username} readOnly style={{ opacity: 0.7 }} />
          <div className="form-hint">Usernames cannot be changed.</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="input" defaultValue={user?.email} readOnly style={{ opacity: 0.7 }} />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Referral Link</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={`https://premiumx.shop/register?ref=${user?.referralCode || user?.username}`} readOnly />
            <button className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>Copy Link</button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Preferences</h3>
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="form-group">
            <label className="form-label">Preferred Currency</label>
            <select className="select" defaultValue={user?.preferredCurrency}>
              <option value="BDT">Bangladeshi Taka (BDT)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="USDT">Tether (USDT)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="select" defaultValue={user?.preferredLanguage}>
              <option value="en">English (EN)</option>
              <option value="bn">Bangla (BN)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-gold" style={{ marginTop: 24 }}>Save Preferences</button>
      </div>
    </div>
  )
}
