import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      buyer: true,
      account: { include: { category: true } },
      transaction: true
    }
  })

  if (!order || order.buyerId !== authUser.userId) {
    redirect('/orders')
  }

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', border: '1px solid #e5e7eb', padding: 40, borderRadius: 8 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: 24, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#111827' }}>PremiumX Shop</h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Official Digital Marketplace</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#374151' }}>RECEIPT</h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Order #{order.id.slice(-8).toUpperCase()}</p>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase' }}>Billed To:</h3>
            <p style={{ margin: 0, fontWeight: 600 }}>{order.buyer.username}</p>
            <p style={{ margin: 0, color: '#4b5563' }}>{order.buyer.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase' }}>Payment Status:</h3>
            <p style={{ margin: 0, fontWeight: 700, color: '#10b981' }}>PAID / COMPLETED</p>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#374151' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '12px 0', color: '#374151' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '12px 0', color: '#374151' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '16px 0' }}>
                <div style={{ fontWeight: 600 }}>{order.account.title}</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>Platform: {order.account.category.name}</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>Username: {order.account.username}</div>
              </td>
              <td style={{ textAlign: 'center', padding: '16px 0' }}>1</td>
              <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: 600 }}>৳{order.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#4b5563' }}>Subtotal</span>
              <span>৳{order.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#4b5563' }}>Tax / Fees</span>
              <span>৳0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '2px solid #e5e7eb', marginTop: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>Total Paid</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>৳{order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          <p>Thank you for your purchase!</p>
          <p>If you have any questions about this receipt, please contact support via the Ticket System.</p>
        </div>

        {/* Print Button (Hidden when printing) */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
          }
        `}} />
        <div className="no-print" style={{ marginTop: 40, textAlign: 'center' }}>
          <button onClick={() => window.print()} style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
            🖨️ Print Receipt / Save as PDF
          </button>
          <div style={{ marginTop: 12 }}>
            <a href="/orders" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Orders</a>
          </div>
        </div>

      </div>
    </div>
  )
}
