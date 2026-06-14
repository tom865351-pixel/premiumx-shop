import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'

export async function GET() {
  const rows = [
    {
      Username: 'example_account@email.com',
      Password: 'example-password',
      '2FA': 'optional-2fa-secret',
      RecoveryEmail: 'optional-recovery@email.com',
      RecoveryPhone: '01700000000',
      AccountAge: '2 years',
      ProofLink: 'https://example.com/screenshot',
    },
    {
      Username: 'another_username',
      Password: 'another-password',
      '2FA': '',
      RecoveryEmail: '',
      RecoveryPhone: '',
      AccountAge: '',
      ProofLink: '',
    },
  ]

  const workbook = xlsx.utils.book_new()
  const worksheet = xlsx.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 34 },
  ]
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Bulk Upload')

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': 'attachment; filename="premiumx-bulk-upload-template.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
