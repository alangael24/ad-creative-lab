import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateROAS(revenue: number | null, spend: number | null): number | null {
  if (!revenue || !spend || spend === 0) return null
  return revenue / spend
}

export function getDaysRemaining(reviewDate: Date | string | null): number {
  if (!reviewDate) return 0
  const now = new Date()
  const review = new Date(reviewDate)
  const diffTime = review.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isLockExpired(reviewDate: Date | string | null): boolean {
  if (!reviewDate) return true
  return new Date(reviewDate) <= new Date()
}
