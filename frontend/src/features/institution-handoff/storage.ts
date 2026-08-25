import type { HandoffResult } from './types'
const RESULT_KEY = 'lifesync-handoff-result'; const INCLUDED_KEY = 'lifesync-handoff-included'
function readJson<T>(key: string, fallback: T): T { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { sessionStorage.removeItem(key); return fallback } }
export const handoffStorage = { getResult: () => readJson<HandoffResult | null>(RESULT_KEY, null), saveResult: (value: HandoffResult) => sessionStorage.setItem(RESULT_KEY, JSON.stringify(value)), getIncluded: () => readJson<Record<string, boolean>>(INCLUDED_KEY, {}), saveIncluded: (value: Record<string, boolean>) => sessionStorage.setItem(INCLUDED_KEY, JSON.stringify(value)) }
export function clearLifeSyncSession() { const keys = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith('lifesync-'))); keys.forEach((key) => sessionStorage.removeItem(key)) }
