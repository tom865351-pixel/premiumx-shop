import crypto from 'crypto'
import * as xlsx from 'xlsx'

export type ParsedResultRow = {
  rowNumber: number
  accountId: string
  username: string
  status: 'valid' | 'invalid' | 'review' | 'unmatched'
  reason: string
  colorStatus?: string
}

const VALID_WORDS = ['valid', 'good', 'ok', 'blue', 'nil', 'approved', 'buy', 'bought']
const INVALID_WORDS = ['invalid', 'bad', 'red', 'lal', 'reject', 'rejected', 'wrong', 'dead', 'nosto']
const REVIEW_WORDS = ['review', 'manual', 'hold', 'yellow']

function normalize(value: unknown) {
  return String(value || '').trim()
}

function headerKey(value: unknown) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function statusFromText(value: string): ParsedResultRow['status'] | null {
  const text = value.toLowerCase().trim()
  if (!text) return null
  if (VALID_WORDS.some((word) => text.includes(word))) return 'valid'
  if (INVALID_WORDS.some((word) => text.includes(word))) return 'invalid'
  if (REVIEW_WORDS.some((word) => text.includes(word))) return 'review'
  return null
}

function statusFromColor(rgb?: string): ParsedResultRow['status'] | null {
  const color = String(rgb || '').replace('#', '').toUpperCase()
  if (!color) return null
  const red = parseInt(color.slice(-6, -4), 16)
  const green = parseInt(color.slice(-4, -2), 16)
  const blue = parseInt(color.slice(-2), 16)
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) return null
  if (blue > 140 && red < 120) return 'valid'
  if (red > 160 && green < 140 && blue < 140) return 'invalid'
  if (red > 180 && green > 140 && blue < 120) return 'review'
  return null
}

function cellColor(cell: any) {
  return cell?.s?.fill?.fgColor?.rgb || cell?.s?.fill?.bgColor?.rgb
}

export function hashBuffer(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function parseResultWorkbook(buffer: Buffer, allowColor = true) {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellStyles: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1')
  const headerRow = range.s.r
  const headers: Record<string, number> = {}

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cell = sheet[xlsx.utils.encode_cell({ r: headerRow, c: col })]
    const key = headerKey(cell?.v)
    if (key) headers[key] = col
  }

  const findCol = (names: string[]) => names.map(headerKey).map((name) => headers[name]).find((col) => col !== undefined)
  const accountCol = findCol(['account_id', 'id', 'accountid'])
  const usernameCol = findCol(['username', 'account_username', 'account', 'account_email', 'email'])
  const statusCol = findCol(['status', 'result', 'color', 'valid_invalid'])
  const reasonCol = findCol(['reason', 'reject_reason', 'note', 'admin_note'])

  const rows: ParsedResultRow[] = []
  for (let row = headerRow + 1; row <= range.e.r; row += 1) {
    const get = (col?: number) => col === undefined ? '' : normalize(sheet[xlsx.utils.encode_cell({ r: row, c: col })]?.v)
    const accountId = get(accountCol)
    const username = get(usernameCol)
    if (!accountId && !username) continue

    let colorStatus: ParsedResultRow['status'] | null = null
    if (allowColor) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        colorStatus = statusFromColor(cellColor(sheet[xlsx.utils.encode_cell({ r: row, c: col })]))
        if (colorStatus) break
      }
    }

    const textStatus = statusFromText(get(statusCol))
    const status = colorStatus || textStatus || 'review'

    rows.push({
      rowNumber: row + 1,
      accountId,
      username,
      status,
      reason: get(reasonCol),
      colorStatus: colorStatus || undefined,
    })
  }

  return rows
}
