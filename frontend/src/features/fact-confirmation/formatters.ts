import type { FactCopy } from './translations'

export function formatFactValue(factKey: string, value: unknown, copy: FactCopy): string {
  if (factKey === 'documentsProvided') {
    if (value === true || value === 'yes') return copy.values.documents_true
    if (value === false || value === 'no') return copy.values.documents_false
    return copy.values.documents_null
  }
  if (value === null || value === undefined) return copy.notConfirmed
  if (typeof value === 'boolean') return copy.values[String(value)]
  return copy.values[String(value)] ?? String(value)
}
