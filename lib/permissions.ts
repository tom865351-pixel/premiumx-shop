import { getSetting } from './settings'

export type StaffPermissionKey =
  | 'dashboard'
  | 'search'
  | 'activity'
  | 'risk'
  | 'users'
  | 'accounts'
  | 'results'
  | 'addAccount'
  | 'orders'
  | 'deposits'
  | 'payments'
  | 'notifications'
  | 'dailyReport'
  | 'audit'
  | 'permissions'
  | 'withdrawals'
  | 'reports'
  | 'support'
  | 'categories'
  | 'announcements'
  | 'settings'

export type StaffRole = 'admin' | 'sub-admin' | 'stock-manager'

export const STAFF_PERMISSION_LABELS: Record<StaffPermissionKey, string> = {
  dashboard: 'Dashboard',
  search: 'Global Search',
  activity: 'Activity',
  risk: 'Risk Center',
  users: 'Users',
  accounts: 'Accounts',
  results: 'Upload Results',
  addAccount: 'Add Stock',
  orders: 'Orders',
  deposits: 'Wallet Deposits',
  payments: 'Payment Monitor',
  notifications: 'Notify Users',
  dailyReport: 'Daily Report',
  audit: 'Site Audit',
  permissions: 'Permission Control',
  withdrawals: 'Withdrawals',
  reports: 'Reports',
  support: 'Support',
  categories: 'Categories',
  announcements: 'Announcements',
  settings: 'Settings',
}

export const STAFF_PERMISSION_KEYS = Object.keys(STAFF_PERMISSION_LABELS) as StaffPermissionKey[]

export const ROLE_SETTING_KEY: Record<Exclude<StaffRole, 'admin'>, string> = {
  'sub-admin': 'subadmin_permissions',
  'stock-manager': 'stockmanager_permissions',
}

function parsePermissionJson(value: string) {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' ? parsed as Record<string, boolean> : {}
  } catch {
    return {}
  }
}

export async function getPermissionsForRole(role: string): Promise<Record<StaffPermissionKey, boolean>> {
  const full = Object.fromEntries(STAFF_PERMISSION_KEYS.map((key) => [key, true])) as Record<StaffPermissionKey, boolean>
  if (role === 'admin') return full
  if (role !== 'sub-admin' && role !== 'stock-manager') {
    return Object.fromEntries(STAFF_PERMISSION_KEYS.map((key) => [key, false])) as Record<StaffPermissionKey, boolean>
  }

  const raw = await getSetting(ROLE_SETTING_KEY[role])
  const parsed = parsePermissionJson(raw)
  return Object.fromEntries(STAFF_PERMISSION_KEYS.map((key) => [key, parsed[key] === true])) as Record<StaffPermissionKey, boolean>
}

export async function canAccessAdminArea(role: string, permission: StaffPermissionKey) {
  const permissions = await getPermissionsForRole(role)
  return permissions[permission] === true
}

export function stringifyPermissions(formData: FormData, prefix: string) {
  const map = Object.fromEntries(
    STAFF_PERMISSION_KEYS.map((key) => [key, formData.get(`${prefix}_${key}`) === 'on'])
  )
  return JSON.stringify(map)
}
