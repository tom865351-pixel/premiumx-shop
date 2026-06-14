import crypto from 'crypto'
import ExcelJS from 'exceljs'
import * as xlsx from 'xlsx'

export type ParsedResultRow = {
  rowNumber: number
  accountId: string
  username: string
  status: 'valid' | 'invalid' | 'review' | 'unmatched'
  reason: string
  colorStatus?: string
}

const VALID_WORDS = ['valid', 'good', 'ok', 'blue', 'nil', 'nill', 'approved', 'approve', 'buy', 'bought', 'success', 'green', 'valo', 'bhalo', 'নীল', 'সবুজ']
const INVALID_WORDS = ['invalid', 'bad', 'red', 'lal', 'reject', 'rejected', 'wrong', 'dead', 'nosto', 'failed', 'fail', 'not working', 'error', 'locked', 'ban', 'লাল']
const REVIEW_WORDS = ['review', 'manual', 'hold', 'yellow', 'pending', 'check', 'holud', 'হলুদ']

const INDEXED_COLORS: Record<number, string> = {
  2: 'FF0000',
  3: '00FF00',
  4: '0000FF',
  5: 'FFFF00',
  10: 'FF0000',
  11: '00FF00',
  12: '0000FF',
  13: 'FFFF00',
  22: 'C0C0C0',
  23: '808080',
}

function normalize(value: unknown) {
  return String(value || '').trim()
}

function headerKey(value: unknown) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function statusFromText(value: string): ParsedResultRow['status'] | null {
  const text = value.toLowerCase().trim()
  if (!text) return null
  if (INVALID_WORDS.some((word) => text.includes(word))) return 'invalid'
  if (VALID_WORDS.some((word) => text.includes(word))) return 'valid'
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
  if (red > 180 && green > 140 && blue < 120) return 'review'
  if (red > 150 && red > green + 35 && red > blue + 35) return 'invalid'
  if (blue > 120 && blue > red + 35 && blue > green + 15) return 'valid'
  if (green > 130 && green > red + 25 && green > blue + 20) return 'valid'
  return null
}

function cellColor(cell: any) {
  return cell?.s?.fill?.fgColor?.rgb || cell?.s?.fill?.bgColor?.rgb
}

function excelColor(color?: Partial<ExcelJS.Color>) {
  if (!color) return ''
  if ('argb' in color && color.argb) return color.argb
  if ('indexed' in color && typeof color.indexed === 'number') return INDEXED_COLORS[color.indexed] || ''
  return ''
}

function excelCellColor(cell?: ExcelJS.Cell) {
  const fill = cell?.fill as ExcelJS.FillPattern | undefined
  const font = cell?.font
  return excelColor(fill?.fgColor) || excelColor(fill?.bgColor) || excelColor(font?.color)
}

async function loadStyledSheet(buffer: Buffer) {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)
    return workbook.worksheets[0]
  } catch {
    return null
  }
}

export function hashBuffer(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function parseResultWorkbook(buffer: Buffer, allowColor = true, unknownStatus: ParsedResultRow['status'] = 'review') {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellStyles: true })
  const styledSheet = allowColor ? await loadStyledSheet(buffer) : null
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
  const statusCol = findCol(['status', 'result', 'color', 'valid_invalid', 'report', 'condition', 'working_status'])
  const reasonCol = findCol(['reason', 'reject_reason', 'note', 'admin_note'])

  const rows: ParsedResultRow[] = []
  for (let row = headerRow + 1; row <= range.e.r; row += 1) {
    const get = (col?: number) => col === undefined ? '' : normalize(sheet[xlsx.utils.encode_cell({ r: row, c: col })]?.v)
    const getColor = (col: number) => {
      const sheetColor = cellColor(sheet[xlsx.utils.encode_cell({ r: row, c: col })])
      const styledColor = styledSheet ? excelCellColor(styledSheet.getCell(row + 1, col + 1)) : ''
      return sheetColor || styledColor
    }
    const accountId = get(accountCol)
    const username = get(usernameCol)
    if (!accountId && !username) continue

    let colorStatus: ParsedResultRow['status'] | null = null
    if (allowColor) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        colorStatus = statusFromColor(getColor(col))
        if (colorStatus) break
      }
    }

    const textStatus = statusFromText(get(statusCol))
    let rowTextStatus: ParsedResultRow['status'] | null = null
    if (!textStatus) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        if ([accountCol, usernameCol, reasonCol].includes(col)) continue
        rowTextStatus = statusFromText(get(col))
        if (rowTextStatus) break
      }
    }
    const status = colorStatus || textStatus || rowTextStatus || unknownStatus

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
