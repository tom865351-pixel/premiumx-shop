import * as xlsx from 'xlsx'

export type ParsedAccountRow = {
  username: string
  password: string
  twoFA: string
  recoveryEmail: string
  recoveryPhone: string
  accountAge: string
  proofLink: string
}

const aliases: Record<keyof ParsedAccountRow, string[]> = {
  username: ['username', 'user', 'user_name', 'account', 'account_username', 'account_user', 'email', 'account_email', 'login', 'id'],
  password: ['password', 'pass', 'pw', 'account_password', 'login_password'],
  twoFA: ['2fa', 'twofa', 'two_fa', '2fa_secret', 'twofa_secret', 'secret', 'backup_code', 'backup_codes', 'recovery_code'],
  recoveryEmail: ['recovery_email', 'recoveryemail', 'recover_email', 'backup_email'],
  recoveryPhone: ['recovery_phone', 'recoveryphone', 'recover_phone', 'backup_phone', 'phone'],
  accountAge: ['age', 'account_age', 'accountage', 'old', 'created'],
  proofLink: ['proof', 'proof_link', 'prooflink', 'screenshot', 'screenshot_link', 'image', 'url'],
}

function clean(value: unknown) {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim()
}

function key(value: unknown) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function findAlias(header: string[], names: string[]) {
  return header.findIndex((item) => names.includes(item))
}

export function parseAccountExcel(buffer: Buffer): { rows: ParsedAccountRow[]; headerFound: boolean; skippedMissing: number } {
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', blankrows: false })
    .map((row) => row.map(clean))
    .filter((row) => row.some(Boolean))

  if (matrix.length === 0) return { rows: [], headerFound: false, skippedMissing: 0 }

  let headerIndex = -1
  let headerKeys: string[] = []
  const maxHeaderScan = Math.min(matrix.length, 15)

  for (let i = 0; i < maxHeaderScan; i += 1) {
    const candidate = matrix[i].map(key)
    const usernameCol = findAlias(candidate, aliases.username)
    const passwordCol = findAlias(candidate, aliases.password)
    if (usernameCol >= 0 && passwordCol >= 0) {
      headerIndex = i
      headerKeys = candidate
      break
    }
  }

  const headerFound = headerIndex >= 0
  const dataRows = headerFound ? matrix.slice(headerIndex + 1) : matrix
  const col = (field: keyof ParsedAccountRow, fallback: number) => headerFound ? findAlias(headerKeys, aliases[field]) : fallback
  const columns = {
    username: col('username', 0),
    password: col('password', 1),
    twoFA: col('twoFA', 2),
    recoveryEmail: col('recoveryEmail', 3),
    recoveryPhone: col('recoveryPhone', 4),
    accountAge: col('accountAge', 5),
    proofLink: col('proofLink', 6),
  }

  let skippedMissing = 0
  const rows: ParsedAccountRow[] = []

  for (const row of dataRows) {
    const get = (index: number) => index >= 0 ? clean(row[index]) : ''
    const item = {
      username: get(columns.username),
      password: get(columns.password),
      twoFA: get(columns.twoFA),
      recoveryEmail: get(columns.recoveryEmail),
      recoveryPhone: get(columns.recoveryPhone),
      accountAge: get(columns.accountAge),
      proofLink: get(columns.proofLink),
    }
    if (!item.username || !item.password) {
      skippedMissing += 1
      continue
    }
    rows.push(item)
  }

  return { rows, headerFound, skippedMissing }
}
