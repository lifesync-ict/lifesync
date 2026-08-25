import type { ActionGuidanceResult } from './types'
import type { EvaluateActionsResponse } from '../../api/contracts'

const RESULT_KEY = 'lifesync-action-guidance'
const COMPLETED_KEY = 'lifesync-completed-actions'
const API_RESULT_KEY = 'lifesync-action-guidance-api'
function readJson<T>(key: string, fallback: T): T { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { sessionStorage.removeItem(key); return fallback } }
export const actionStorage = {
  getResult: () => readJson<ActionGuidanceResult | null>(RESULT_KEY, null),
  saveResult: (result: ActionGuidanceResult) => sessionStorage.setItem(RESULT_KEY, JSON.stringify(result)),
  getApiResult: () => readJson<EvaluateActionsResponse | null>(API_RESULT_KEY, null),
  saveApiResult: (result: EvaluateActionsResponse) => sessionStorage.setItem(API_RESULT_KEY, JSON.stringify(result)),
  getCompleted: () => readJson<string[]>(COMPLETED_KEY, []),
  saveCompleted: (ids: string[]) => sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(ids)),
  clearResult: () => { sessionStorage.removeItem(RESULT_KEY); sessionStorage.removeItem(API_RESULT_KEY) },
}
