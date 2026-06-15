export function normalizeSheetUrl(input: string) {
  const url = input.trim()
  if (!url) return ''

  const googleMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (googleMatch) {
    return `https://docs.google.com/spreadsheets/d/${googleMatch[1]}/export?format=xlsx`
  }

  return url
}

export async function fetchPublicSheetBuffer(input: string) {
  const normalized = normalizeSheetUrl(input)
  if (!normalized) throw new Error('Sheet link is required')
  if (!/^https?:\/\//i.test(normalized)) throw new Error('Sheet link must start with http or https')

  const response = await fetch(normalized, {
    headers: {
      'User-Agent': 'PremiumX-Shop/1.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Could not download the public Sheet/Excel link. Make sure sharing is public.')
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
