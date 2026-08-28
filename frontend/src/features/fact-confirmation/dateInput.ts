export type DatePart = 'year' | 'month' | 'day'
export type DateParts = Record<DatePart, string>

export const emptyDateParts = (): DateParts => ({ year: '', month: '', day: '' })

export function parseIsoDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : emptyDateParts()
}

export function daysInMonth(year: string, month: string) {
  const numericYear = Number(year)
  const numericMonth = Number(month)
  if (!numericYear || !numericMonth) return 31
  return new Date(numericYear, numericMonth, 0).getDate()
}

export function datePartsToIso(parts: DateParts) {
  if (!parts.year || !parts.month || !parts.day) return ''
  const month = Number(parts.month)
  const day = Number(parts.day)
  if (!/^\d{4}$/.test(parts.year) || month < 1 || month > 12 || day < 1 || day > daysInMonth(parts.year, parts.month)) return ''
  return `${parts.year}-${parts.month.padStart(2, '0')}-${parts.day.padStart(2, '0')}`
}
