import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import WithdrawModal from './WithdrawModal'
import DepositForm from '@/app/deposit/DepositForm'
import styles from './Wallet.module.css'

function txLabel(type: string) {
  if (type === 'topup') return 'Add Money'
  if (type === 'purchase') return 'Purchase'
  if (type === 'sale') return 'Sale'
  if (type === 'refund') return 'Refund'
  if (type === 'withdrawal') return 'Withdraw'
  if (type === 'referral') return 'Referral'
  return type
}

function badgeColor(type: string) {
  if (type === 'topup' || type === 'sale' || type === 'referral') return { background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }
  if (type === 'purchase' || type === 'withdrawal') return { background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }
  if (type === 'refund') return { background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }
  return { background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }
}

function statusBadge(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function WalletPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      topupRequests: { orderBy: { createdAt: 'desc' }, take: 8 },
      withdrawals: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  })

  if (!user) redirect('/login')

  const walletSettings = await getSettings(['min_topup_bdt', 'bkash_number', 'nagad_number', 'rocket_number'])
  const minTopup = Number.parseFloat(walletSettings.min_topup_bdt || '50') || 50
  const paymentMethods = [
    { value: 'bkash', label: 'bKash', name: 'bKash', number: walletSettings.bkash_number },
    { value: 'nagad', label: 'Nagad', name: 'Nagad', number: walletSettings.nagad_number },
    { value: 'rocket', label: 'Rocket', name: 'Rocket', number: walletSettings.rocket_number },
  ]

  const totalTopup = user.transactions.filter((tx) => tx.type === 'topup').reduce((sum, tx) => sum + tx.amount, 0)
  const totalSales = user.transactions.filter((tx) => tx.type === 'sale').reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawn = user.withdrawals.filter((withdrawal) => withdrawal.status === 'approved').reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingWithdrawals = user.withdrawals.filter((withdrawal) => withdrawal.status === 'pending')
  const pendingHold = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingTopups = user.topupRequests.filter((topup) => topup.status === 'pending').length

  return (
    <div className={styles.shell}>
      <Navbar user={user as any} />

      <main className={`container ${styles.main}`}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>One wallet</div>
            <h1 className={styles.title}>Wallet</h1>
            <p className={styles.subtitle}>Add money, withdraw seller earnings, and track every request without jumping between two pages.</p>
          </div>
          <div className={styles.heroActions}>
            <a href="#add-money" className="btn btn-gold">Add Money</a>
            <a href="#withdrawals" className="btn btn-outline">History</a>
          </div>
        </section>

        <section className={styles.summaryGrid}>
          <div className={styles.balanceCard}>
            <div className={styles.label}>Available Balance</div>
            <div className={styles.balance}>BDT {user.balance.toLocaleString()}</div>
            <div className={styles.metricHint}>This is the money you can use or withdraw now.</div>
            <div className={styles.balanceActions}>
              <WithdrawModal balance={user.balance} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.label}>Pending Hold</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>BDT {pendingHold.toLocaleString()}</div>
            <div className={styles.metricHint}>{pendingWithdrawals.length} withdrawal request{pendingWithdrawals.length === 1 ? '' : 's'} waiting</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.label}>Paid Out</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>BDT {totalWithdrawn.toLocaleString()}</div>
            <div className={styles.metricHint}>Total completed withdrawals</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.label}>Added Money</div>
            <div className={styles.metricValue} style={{ color: 'var(--info)' }}>BDT {totalTopup.toLocaleString()}</div>
            <div className={styles.metricHint}>{pendingTopups} pending add money request{pendingTopups === 1 ? '' : 's'}</div>
          </div>
        </section>

        <section id="add-money" className={styles.quickGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Add Money</h2>
                <div className={styles.panelSub}>Send money first, then submit the TrxID here.</div>
              </div>
            </div>
            <div className={styles.methodGrid}>
              {paymentMethods.map((method) => (
                <div key={method.name} className={styles.methodCard}>
                  <div className={styles.methodName}>{method.name}</div>
                  <div className={styles.methodNumber}>{method.number}</div>
                </div>
              ))}
            </div>
            <DepositForm methods={paymentMethods} minAmount={minTopup} />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Recent Add Money</h2>
                <div className={styles.panelSub}>Manual and gateway requests appear together.</div>
              </div>
            </div>
            <div className={`${styles.tableCard} ${styles.desktopTable}`}>
              <table className={`table ${styles.table}`}>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {user.topupRequests.length === 0 ? (
                    <tr><td colSpan={5} className="text-center" style={{ padding: 28, color: 'var(--text-muted)' }}>No add money requests yet</td></tr>
                  ) : (
                    user.topupRequests.map((topup) => (
                      <tr key={topup.id}>
                        <td className="font-mono text-gold" style={{ fontWeight: 800 }}>BDT {topup.amount.toLocaleString()}</td>
                        <td style={{ textTransform: 'uppercase' }}>{topup.method}</td>
                        <td><span className={`badge badge-${statusBadge(topup.status)}`}>{topup.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(topup.createdAt).toLocaleDateString()}</td>
                        <td>
                          {topup.status === 'pending' ? (
                            <form action={`/api/deposit/${topup.id}/cancel`} method="POST">
                              <button className="btn btn-sm btn-outline" type="submit">Cancel</button>
                            </form>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Done</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.mobileList}>
              {user.topupRequests.length === 0 ? (
                <div className={styles.empty}>No add money requests yet</div>
              ) : (
                user.topupRequests.map((topup) => (
                  <article key={topup.id} className={styles.miniItem}>
                    <div className={styles.miniTop}>
                      <div>
                        <div className={styles.miniTitle}>BDT {topup.amount.toLocaleString()}</div>
                        <div className={styles.miniMeta}>{topup.method.toUpperCase()} - {new Date(topup.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge badge-${statusBadge(topup.status)}`}>{topup.status}</span>
                    </div>
                    <div className={styles.miniGrid}>
                      <div className={styles.miniBox}>
                        <div className={styles.miniLabel}>TrxID</div>
                        <div className={styles.miniValue}>{topup.transactionId || '-'}</div>
                      </div>
                    </div>
                    {topup.status === 'pending' && (
                      <form action={`/api/deposit/${topup.id}/cancel`} method="POST" style={{ marginTop: 10 }}>
                        <button className="btn btn-sm btn-outline w-full" type="submit">Cancel Request</button>
                      </form>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <h2 id="withdrawals" className={styles.sectionTitle}>Withdrawals</h2>
        <div className={`${styles.tableCard} ${styles.desktopTable}`}>
          <table className={`table ${styles.table}`}>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Account</th>
                <th>Status</th>
                <th>Reference / Note</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {user.withdrawals.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>No withdrawals yet</td></tr>
              ) : (
                user.withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="font-mono text-gold" style={{ fontWeight: 800 }}>BDT {withdrawal.amount.toLocaleString()}</td>
                    <td style={{ textTransform: 'uppercase' }}>{withdrawal.method}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{withdrawal.accountNumber}</td>
                    <td><span className={`badge badge-${statusBadge(withdrawal.status)}`}>{withdrawal.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{withdrawal.reference || withdrawal.adminNote || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                    <td>
                      {withdrawal.status === 'pending' ? (
                        <form action={`/api/withdraw/${withdrawal.id}/cancel`} method="POST">
                          <button className="btn btn-sm btn-outline" type="submit">Cancel</button>
                        </form>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileList}>
          {user.withdrawals.length === 0 ? (
            <div className={styles.empty}>No withdrawals yet</div>
          ) : (
            user.withdrawals.map((withdrawal) => (
              <article key={withdrawal.id} className={styles.miniItem}>
                <div className={styles.miniTop}>
                  <div>
                    <div className={styles.miniTitle}>BDT {withdrawal.amount.toLocaleString()}</div>
                    <div className={styles.miniMeta}>{withdrawal.method.toUpperCase()} - {new Date(withdrawal.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge badge-${statusBadge(withdrawal.status)}`}>{withdrawal.status}</span>
                </div>
                <div className={styles.miniGrid}>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Account</div>
                    <div className={styles.miniValue}>{withdrawal.accountNumber}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Reference / Note</div>
                    <div className={styles.miniValue}>{withdrawal.reference || withdrawal.adminNote || '-'}</div>
                  </div>
                </div>
                {withdrawal.status === 'pending' && (
                  <form action={`/api/withdraw/${withdrawal.id}/cancel`} method="POST" style={{ marginTop: 10 }}>
                    <button className="btn btn-sm btn-outline w-full" type="submit">Cancel Request</button>
                  </form>
                )}
              </article>
            ))
          )}
        </div>

        <h2 className={styles.sectionTitle}>Transaction History</h2>
        <div className={`${styles.tableCard} ${styles.desktopTable}`}>
          <table className={`table ${styles.table}`}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
              ) : (
                user.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>#{tx.id.slice(-6).toUpperCase()}</td>
                    <td><span className="badge" style={badgeColor(tx.type)}>{txLabel(tx.type)}</span></td>
                    <td className={`font-mono ${tx.amount > 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 800 }}>
                      {tx.amount > 0 ? '+' : '-'}BDT {Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="font-mono text-gold">BDT {tx.balance.toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tx.description}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileList}>
          {user.transactions.length === 0 ? (
            <div className={styles.empty}>No transactions yet</div>
          ) : (
            user.transactions.map((tx) => (
              <article key={tx.id} className={styles.miniItem}>
                <div className={styles.miniTop}>
                  <div>
                    <div className={styles.miniTitle}>{tx.amount > 0 ? '+' : '-'}BDT {Math.abs(tx.amount).toLocaleString()}</div>
                    <div className={styles.miniMeta}>#{tx.id.slice(-6).toUpperCase()} - {new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="badge" style={badgeColor(tx.type)}>{txLabel(tx.type)}</span>
                </div>
                <div className={styles.miniGrid}>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Balance After</div>
                    <div className={styles.miniValue}>BDT {tx.balance.toLocaleString()}</div>
                  </div>
                  <div className={styles.miniBox}>
                    <div className={styles.miniLabel}>Description</div>
                    <div className={styles.miniValue}>{tx.description}</div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
