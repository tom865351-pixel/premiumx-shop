import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export default async function AdminSettings() {
  const user = await getAuthUser()
  if (!user || user.role !== 'admin') redirect('/login')

  const settings = await getSettings([
    'site_name',
    'commission_rate',
    'report_window_hours',
    'min_topup_bdt',
    'bkash_number',
    'nagad_number',
    'rocket_number',
    'crypto_wallet',
    'usd_rate',
    'usdt_rate',
    'maintenance_mode',
    'maintenance_message',
    'contact_email',
    'contact_telegram',
    'homepage_badges',
    'homepage_hero_badge',
    'homepage_hero_title',
    'homepage_hero_highlight',
    'homepage_hero_subtitle',
    'live_resources',
    'reject_templates',
    'support_reply_templates',
    'fraud_rules',
    'payout_min_bdt',
    'payout_limit_daily_bdt',
    'next_payout_time',
    'subadmin_permissions',
    'bulk_result_auto_credit',
    'bulk_result_credit_mode',
    'bulk_result_reason_mode',
    'bulk_result_default_reason',
    'bulk_result_allow_color',
  ])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Settings</h1>
          <p className="page-subtitle">Configure wallet, payout, contact, and marketplace settings.</p>
        </div>
      </div>

      <form action="/api/admin/settings" method="POST">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>General</h3>

            <div className="form-group">
              <label className="form-label">Site Name</label>
              <input className="input" name="site_name" defaultValue={settings.site_name} placeholder="PremiumX Shop" />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="input" name="contact_email" type="email" defaultValue={settings.contact_email} placeholder="support@premiumx.shop" />
            </div>

            <div className="form-group">
              <label className="form-label">Telegram Contact</label>
              <input className="input" name="contact_telegram" defaultValue={settings.contact_telegram} placeholder="@premiumxshop" />
            </div>

            <div className="form-group">
              <label className="form-label">Maintenance Mode</label>
              <select className="select" name="maintenance_mode" defaultValue={settings.maintenance_mode}>
                <option value="false">Off - site is live</option>
                <option value="true">On - maintenance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Maintenance Message</label>
              <textarea className="input" name="maintenance_message" defaultValue={settings.maintenance_message} rows={3} placeholder="Site update message" />
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Financial</h3>

            <div className="form-group">
              <label className="form-label">Commission Rate (%)</label>
              <input className="input" name="commission_rate" type="number" min="0" max="100" defaultValue={settings.commission_rate} placeholder="10" />
            </div>

            <div className="form-group">
              <label className="form-label">Report Window (Hours)</label>
              <input className="input" name="report_window_hours" type="number" defaultValue={settings.report_window_hours} placeholder="48" />
            </div>

            <div className="form-group">
              <label className="form-label">Min Add Money Amount (BDT)</label>
              <input className="input" name="min_topup_bdt" type="number" min="1" defaultValue={settings.min_topup_bdt} placeholder="100" />
            </div>

            <div className="form-group">
              <label className="form-label">Min Withdrawal Amount (BDT)</label>
              <input className="input" name="payout_min_bdt" type="number" min="1" defaultValue={settings.payout_min_bdt} placeholder="100" />
            </div>

            <div className="form-group">
              <label className="form-label">Daily Payout Limit (BDT)</label>
              <input className="input" name="payout_limit_daily_bdt" type="number" min="1" defaultValue={settings.payout_limit_daily_bdt} placeholder="50000" />
            </div>

            <div className="form-group">
              <label className="form-label">Next Payout Time Text</label>
              <input className="input" name="next_payout_time" defaultValue={settings.next_payout_time} placeholder="Every day at 10:00 PM" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">1 USD = BDT</label>
                <input className="input" name="usd_rate" type="number" defaultValue={settings.usd_rate} placeholder="110" />
              </div>
              <div className="form-group">
                <label className="form-label">1 USDT = BDT</label>
                <input className="input" name="usdt_rate" type="number" defaultValue={settings.usdt_rate} placeholder="110" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22, gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Wallet Payment Numbers</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">bKash Number</label>
                <input className="input" name="bkash_number" defaultValue={settings.bkash_number} placeholder="01XXXXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Nagad Number</label>
                <input className="input" name="nagad_number" defaultValue={settings.nagad_number} placeholder="01XXXXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Rocket Number</label>
                <input className="input" name="rocket_number" defaultValue={settings.rocket_number} placeholder="01XXXXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Crypto Wallet (USDT TRC20)</label>
                <input className="input" name="crypto_wallet" defaultValue={settings.crypto_wallet} placeholder="TXXXXXXXXXXX" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22, gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Admin Workflow Controls</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Homepage Badges (comma separated)</label>
                <textarea className="input" name="homepage_badges" defaultValue={settings.homepage_badges} rows={4} placeholder="Admin reviewed stock,Wallet payout tracking" />
              </div>
              <div className="form-group">
                <label className="form-label">Reject Reason Templates</label>
                <textarea className="input" name="reject_templates" defaultValue={settings.reject_templates} rows={4} placeholder="One reason per line" />
              </div>
              <div className="form-group">
                <label className="form-label">Support Reply Templates</label>
                <textarea className="input" name="support_reply_templates" defaultValue={settings.support_reply_templates} rows={4} placeholder="One canned reply per line" />
              </div>
              <div className="form-group">
                <label className="form-label">Fraud Rules JSON</label>
                <textarea className="input" name="fraud_rules" defaultValue={settings.fraud_rules} rows={4} placeholder='{"highRejectRate":40}' />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22, gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Bulk Result Auto Report</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Auto Credit</label>
                <select className="select" name="bulk_result_auto_credit" defaultValue={settings.bulk_result_auto_credit}>
                  <option value="true">On - process valid rows</option>
                  <option value="false">Off - preview/report only</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Credit Mode</label>
                <select className="select" name="bulk_result_credit_mode" defaultValue={settings.bulk_result_credit_mode}>
                  <option value="instant">Instant wallet credit</option>
                  <option value="pending">Pending payout first</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Reject Reason Mode</label>
                <select className="select" name="bulk_result_reason_mode" defaultValue={settings.bulk_result_reason_mode}>
                  <option value="same">Same reason</option>
                  <option value="row">Row-wise reason column</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Color Detection</label>
                <select className="select" name="bulk_result_allow_color" defaultValue={settings.bulk_result_allow_color}>
                  <option value="true">On - blue/red/yellow cells</option>
                  <option value="false">Off - status column only</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Reject Reason</label>
                <input className="input" name="bulk_result_default_reason" defaultValue={settings.bulk_result_default_reason} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22, gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Homepage & Live Content Control</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Hero Badge</label>
                <input className="input" name="homepage_hero_badge" defaultValue={settings.homepage_hero_badge} />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Title</label>
                <input className="input" name="homepage_hero_title" defaultValue={settings.homepage_hero_title} />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Highlight</label>
                <input className="input" name="homepage_hero_highlight" defaultValue={settings.homepage_hero_highlight} />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Subtitle</label>
                <textarea className="input" name="homepage_hero_subtitle" defaultValue={settings.homepage_hero_subtitle} rows={4} />
              </div>
              <div className="form-group">
                <label className="form-label">Live Resource Links</label>
                <textarea className="input" name="live_resources" defaultValue={settings.live_resources} rows={4} placeholder="Title|URL, one per line" />
              </div>
              <div className="form-group">
                <label className="form-label">Sub-admin Permissions JSON</label>
                <textarea className="input" name="subadmin_permissions" defaultValue={settings.subadmin_permissions} rows={4} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit" style={{ padding: '12px 32px', fontSize: 15 }}>
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  )
}
