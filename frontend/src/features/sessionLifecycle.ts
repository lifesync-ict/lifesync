const SOURCE_KEY = 'lifesync-fact-source'

const DERIVED_KEYS = [
  'lifesync-fact-analysis',
  'lifesync-fact-answers',
  'lifesync-fact-question-index',
  'lifesync-fact-question-editing',
  'lifesync-confirmed-facts',
  'lifesync-action-guidance',
  'lifesync-completed-actions',
  'lifesync-handoff-result',
  'lifesync-handoff-included',
] as const

const AFTER_FACT_CHANGE_KEYS = [
  'lifesync-confirmed-facts',
  'lifesync-action-guidance',
  'lifesync-completed-actions',
  'lifesync-handoff-result',
  'lifesync-handoff-included',
] as const

export function normalizeSourceText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function prepareSourceSession(value: string) {
  const source = normalizeSourceText(value)
  if (sessionStorage.getItem(SOURCE_KEY) !== source) {
    DERIVED_KEYS.forEach((key) => sessionStorage.removeItem(key))
    sessionStorage.setItem(SOURCE_KEY, source)
  }
  return source
}

export function invalidateAfterFactChange() {
  AFTER_FACT_CHANGE_KEYS.forEach((key) => sessionStorage.removeItem(key))
}
