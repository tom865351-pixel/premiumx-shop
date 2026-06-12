import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tx_id = req.nextUrl.searchParams.get('tx_id')
  const amount = req.nextUrl.searchParams.get('amount')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!tx_id) {
    return NextResponse.json({ error: 'Missing tx_id' }, { status: 400 })
  }

  // Render a mock checkout page
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ZiniPay Checkout (MOCK)</title>
      <style>
        body { font-family: sans-serif; background: #030712; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #0f172a; padding: 40px; border-radius: 16px; border: 1px solid #1e293b; text-align: center; max-width: 400px; width: 100%; }
        .btn { display: block; width: 100%; padding: 14px; background: #0d6efd; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: 0.2s; }
        .btn:hover { background: #0b5ed7; }
        .btn-danger { background: transparent; border: 1px solid #dc3545; color: #dc3545; }
        .btn-danger:hover { background: rgba(220, 53, 69, 0.1); }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>ZiniPay Secure Checkout</h2>
        <p style="color: #94a3b8">This is a mock page because the real API key is not configured yet.</p>
        <h1 style="color: #D4AF37; margin: 30px 0; font-size: 40px;">৳${amount}</h1>
        <p>Transaction ID: ${tx_id}</p>
        
        <form action="${baseUrl}/api/deposit/zinipay/mock-checkout" method="POST">
          <input type="hidden" name="tx_id" value="${tx_id}">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="status" value="success">
          <button type="submit" class="btn">Confirm Payment</button>
        </form>

        <form action="${baseUrl}/api/deposit/zinipay/mock-checkout" method="POST">
          <input type="hidden" name="tx_id" value="${tx_id}">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="status" value="failed">
          <button type="submit" class="btn btn-danger">Cancel</button>
        </form>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

// Handle the mock form submission
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const tx_id = formData.get('tx_id') as string
  const status = formData.get('status') as string
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (status === 'success') {
    // Manually trigger our own callback
    try {
      await fetch(`${baseUrl}/api/deposit/zinipay/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          transaction_id: tx_id,
        })
      })
    } catch (e) {
      console.error('Mock callback trigger failed:', e)
    }
    // Redirect user to success page
    return NextResponse.redirect(`${baseUrl}/deposit/success?tx_id=${tx_id}`, 303)
  } else {
    // Trigger failure callback
    try {
      await fetch(`${baseUrl}/api/deposit/zinipay/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED',
          transaction_id: tx_id,
        })
      })
    } catch (e) {}
    // Redirect user to fail page
    return NextResponse.redirect(`${baseUrl}/deposit/fail`, 303)
  }
}
