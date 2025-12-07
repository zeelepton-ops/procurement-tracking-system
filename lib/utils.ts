import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'NORMAL':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'LOW':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    case 'IN_PROCUREMENT':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'ORDERED':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200'
    case 'PARTIALLY_RECEIVED':
      return 'text-purple-700 bg-purple-50 border-purple-200'
    case 'RECEIVED':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'CANCELLED':
      return 'text-red-700 bg-red-50 border-red-200'
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

export function calculateDaysUntilRequired(requiredDate: Date | string): number {
  const required = new Date(requiredDate)
  const today = new Date()
  const diffTime = required.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function isOverdue(requiredDate: Date | string): boolean {
  return calculateDaysUntilRequired(requiredDate) < 0
}

export function isUrgent(requiredDate: Date | string, urgency: string): boolean {
  const daysLeft = calculateDaysUntilRequired(requiredDate)
  return urgency === 'CRITICAL' || urgency === 'HIGH' || daysLeft <= 3
}
