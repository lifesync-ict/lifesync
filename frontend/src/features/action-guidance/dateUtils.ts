import type { Urgency } from './types'

const DAY_MS = 86_400_000
export function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
export function addDays(value: string, days: number): string | null {
  const date = parseDate(value); if (!date) return null
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
export function getDeadlineState(deadline: string | null, now = new Date()): { daysRemaining: number | null; urgency: Urgency } {
  const parsed = parseDate(deadline); if (!parsed) return { daysRemaining: null, urgency: 'unknown' }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysRemaining = Math.ceil((parsed.getTime() - today.getTime()) / DAY_MS)
  const urgency: Urgency = daysRemaining < 0 ? 'overdue' : daysRemaining === 0 ? 'today' : daysRemaining <= 3 ? 'urgent' : 'normal'
  return { daysRemaining, urgency }
}
export function formatDate(value: string | null, locale: string): string | null {
  const date = parseDate(value); return date ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date) : null
}
