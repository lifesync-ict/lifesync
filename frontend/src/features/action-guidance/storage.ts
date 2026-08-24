import type { ActionGuidanceResult } from './types'

const RESULT_KEY = 'lifesync-action-guidance'
const COMPLETED_KEY = 'lifesync-completed-actions'
function readJson<T>(key: string, fallback: T): T { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { sessionStorage.removeItem(key); return fallback } }
export const actionStorage = {
  getResult: () => readJson<ActionGuidanceResult | null>(RESULT_KEY, null),
  saveResult: (result: ActionGuidanceResult) => sessionStorage.setItem(RESULT_KEY, JSON.stringify(result)),
  getCompleted: () => readJson<string[]>(COMPLETED_KEY, []),
  saveCompleted: (ids: string[]) => sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(ids)),
  clearResult: () => sessionStorage.removeItem(RESULT_KEY),
}
