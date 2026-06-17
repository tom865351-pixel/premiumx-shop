import * as xlsx from 'xlsx'

export type CollectionExportAccount = {
  id: string
  categoryId: string
  status: string
  username: string
  password: string
  twoFASecret: string | null
  recoveryEmail: string | null
  recoveryPhone: string | null
  accountAge: string | null
  price: number
  createdAt: Date
  category: { name: string }
  seller: { username: string; email: string; phone: string | null }
  extraFields: string
}

function safeSheetName(name: string) {
  return (name || 'Accounts').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31).trim() || 'Accounts'
}

export function buildCollectionWorkbook(accounts: CollectionExportAccount[], meta: { categoryName: string; mode: string; status: string; batchId: string }) {
  const grouped = new Map<string, CollectionExportAccount[]>()
  for (const account of accounts) {
    const key = account.category.name || meta.categoryName
    grouped.set(key, [...(grouped.get(key) || []), account])
  }

  if (grouped.size === 0) grouped.set(meta.categoryName, [])

  const workbook = xlsx.utils.book_new()
  for (const [categoryName, categoryAccounts] of Array.from(grouped.entries())) {
    const rows = categoryAccounts.map((account, index) => {
    let extra: any = {}
    try { extra = JSON.parse(account.extraFields || '{}') } catch {}
    return {
      No: index + 1,
      Collection_Batch_ID: meta.batchId,
      Collection_Mode: meta.mode,
      Status: account.status.toUpperCase(),
      Platform: account.category.name,
      Seller_Username: account.seller.username,
      Seller_Email: account.seller.email,
      Seller_Phone: account.seller.phone || '-',
      Account_Username: account.username,
      Password: account.password,
      Two_FA_Secret: account.twoFASecret || '-',
      Recovery_Email: account.recoveryEmail || '-',
      Recovery_Phone: account.recoveryPhone || '-',
      Account_Age: account.accountAge || '-',
      Bulk_Submission_ID: extra.bulkBatchId || '',
      Price_BDT: account.price,
      Submitted_At: new Date(account.createdAt).toLocaleString('en-BD'),
      Account_ID: account.id,
    }
  })

    const worksheet = xlsx.utils.json_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 24 }, { wch: 24 },
      { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 24 }, { wch: 30 },
    ]
    xlsx.utils.book_append_sheet(workbook, worksheet, safeSheetName(`${categoryName} ${categoryAccounts.length}`))
  }

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
