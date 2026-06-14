export function isMissingResultBatchTables(error: unknown) {
  const prismaError = error as { code?: string; message?: string; meta?: { modelName?: string; table?: string } }
  const message = `${prismaError?.message || ''} ${prismaError?.meta?.modelName || ''} ${prismaError?.meta?.table || ''}`.toLowerCase()

  return (
    prismaError?.code === 'P2021' ||
    (message.includes('resultbatch') || message.includes('resultrow') || message.includes('result_batches') || message.includes('result_rows')) &&
      (message.includes('does not exist') || message.includes('table') || message.includes('not found'))
  )
}

export const RESULT_BATCH_SETUP_MESSAGE =
  'Result upload database setup is not complete yet. Run Prisma db push/migration with the production DATABASE_URL, then reopen this page.'
