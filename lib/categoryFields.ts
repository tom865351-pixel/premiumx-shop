export type SellerFieldKey =
  | 'username'
  | 'password'
  | 'twoFASecret'
  | 'recoveryEmail'
  | 'recoveryPhone'
  | 'accountAge'
  | 'proofLink'

export type CategoryFieldConfig = {
  enabledFields: SellerFieldKey[]
  videoUrl?: string
}

export const SELLER_FIELD_OPTIONS: Array<{
  key: SellerFieldKey
  label: string
  required?: boolean
  placeholder: string
}> = [
  { key: 'username', label: 'Username / Email', required: true, placeholder: 'Account username or email' },
  { key: 'password', label: 'Password', required: true, placeholder: 'Account password' },
  { key: 'twoFASecret', label: '2FA Secret Code', placeholder: 'Paste 2FA secret or recovery code here' },
  { key: 'recoveryEmail', label: 'Recovery Email', placeholder: 'Recovery email if available' },
  { key: 'recoveryPhone', label: 'Recovery Phone', placeholder: 'Recovery phone if available' },
  { key: 'accountAge', label: 'Account Age', placeholder: 'Example: 2 years old' },
  { key: 'proofLink', label: 'Proof Link', placeholder: 'Screenshot/proof link' },
]

export const DEFAULT_SELLER_FIELDS: SellerFieldKey[] = SELLER_FIELD_OPTIONS.map((field) => field.key)

export function parseCategoryFieldConfig(fields?: string | null): CategoryFieldConfig {
  if (!fields) return { enabledFields: DEFAULT_SELLER_FIELDS }

  try {
    const parsed = JSON.parse(fields)

    if (Array.isArray(parsed)) {
      const enabledFields = parsed.filter((field): field is SellerFieldKey =>
        SELLER_FIELD_OPTIONS.some((option) => option.key === field),
      )
      return { enabledFields: enabledFields.length ? enabledFields : DEFAULT_SELLER_FIELDS }
    }

    if (parsed && typeof parsed === 'object') {
      const enabledFields = Array.isArray(parsed.enabledFields)
        ? parsed.enabledFields.filter((field: string): field is SellerFieldKey =>
            SELLER_FIELD_OPTIONS.some((option) => option.key === field),
          )
        : DEFAULT_SELLER_FIELDS

      return {
        enabledFields: enabledFields.length ? enabledFields : DEFAULT_SELLER_FIELDS,
        videoUrl: typeof parsed.videoUrl === 'string' ? parsed.videoUrl : '',
      }
    }
  } catch {
    return { enabledFields: DEFAULT_SELLER_FIELDS }
  }

  return { enabledFields: DEFAULT_SELLER_FIELDS }
}

export function stringifyCategoryFieldConfig(config: CategoryFieldConfig) {
  const enabledFields = config.enabledFields.filter((field, index, fields) =>
    SELLER_FIELD_OPTIONS.some((option) => option.key === field) && fields.indexOf(field) === index,
  )

  return JSON.stringify({
    enabledFields: enabledFields.length ? enabledFields : DEFAULT_SELLER_FIELDS,
    videoUrl: config.videoUrl?.trim() || '',
  })
}

export function getYouTubeEmbedUrl(url?: string | null) {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    let id = ''

    if (host === 'youtu.be') id = parsed.pathname.slice(1)
    if (host.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) id = parsed.pathname.split('/')[2] || ''
      if (parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2] || ''
      id = id || parsed.searchParams.get('v') || ''
    }

    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : ''
  } catch {
    return ''
  }
}
