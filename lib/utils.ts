export function formatCurrency(amount: number, currency: string = 'BDT', usdRate: number = 110, usdtRate: number = 110): string {
  switch (currency) {
    case 'USD':
      return `$${(amount / usdRate).toFixed(2)}`
    case 'USDT':
      return `₮${(amount / usdtRate).toFixed(2)}`
    default:
      return `৳${amount.toLocaleString('en-BD')}`
  }
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.substring(0, len) + '...' : str
}

export function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) } catch { return fallback }
}
