import prisma from '@/lib/prisma'

export function normalizeUsername(username: string) {
  return username.toLowerCase().trim()
}

export async function findExistingAccounts(usernames: string[], categoryId?: string) {
  const normalized = Array.from(new Set(usernames.map(normalizeUsername).filter(Boolean)))
  if (normalized.length === 0) return []

  return prisma.account.findMany({
    where: {
      status: { not: 'rejected' },
      ...(categoryId ? { categoryId } : {}),
      OR: normalized.map((username) => ({
        username: { equals: username, mode: 'insensitive' as const },
      })),
    },
    select: {
      id: true,
      username: true,
      status: true,
      categoryId: true,
      seller: { select: { username: true } },
      category: { select: { name: true } },
    },
  })
}

export async function checkDuplicateUsername(username: string, categoryId: string) {
  const existing = await findExistingAccounts([username], categoryId)
  return existing[0] || null
}
