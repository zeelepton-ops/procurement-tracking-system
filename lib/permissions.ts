// Permission utilities for edit/delete operations

export function canEditOrDelete(
  createdAt: Date | string,
  userRole: string
): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  // Admin can always edit/delete
  if (userRole === 'ADMIN') {
    return true
  }
  
  // Regular users can edit/delete within 4 days
  return daysDiff <= 4
}

export function getDaysOld(createdAt: Date | string): number {
  const created = new Date(createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}

export function requiresAdminPermission(createdAt: Date | string): boolean {
  return getDaysOld(createdAt) > 4
}
