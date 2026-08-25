import type {
  AnalyzeFactsRequest,
  AnalyzeFactsResponse,
  ConfirmFactsRequest,
  ConfirmFactsResponse,
  EvaluateActionsRequest,
  EvaluateActionsResponse,
  PrepareHandoffRequest,
  PrepareHandoffResponse,
  ReadyResponse,
} from './contracts'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')
const DEFAULT_TIMEOUT_MS = 20_000

export type ApiErrorKind = 'cancelled' | 'timeout' | 'network' | 'http' | 'invalid_response'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, status?: number) {
    super(kind)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeout = window.setTimeout(() => { timedOut = true; controller.abort() }, DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      signal: controller.signal,
    })
    if (!response.ok) throw new ApiError('http', response.status)
    try { return await response.json() as T } catch { throw new ApiError('invalid_response', response.status) }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) throw new ApiError(timedOut ? 'timeout' : 'cancelled')
    throw new ApiError('network')
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

export const apiClient = {
  ready: (signal?: AbortSignal) => request<ReadyResponse>('/api/v1/ready', {}, signal),
  analyzeFacts: (body: AnalyzeFactsRequest, signal?: AbortSignal) => request<AnalyzeFactsResponse>('/api/v1/facts/analyze', { method: 'POST', body: JSON.stringify(body) }, signal),
  confirmFacts: (body: ConfirmFactsRequest, signal?: AbortSignal) => request<ConfirmFactsResponse>('/api/v1/facts/confirm', { method: 'POST', body: JSON.stringify(body) }, signal),
  evaluateActions: (body: EvaluateActionsRequest, signal?: AbortSignal) => request<EvaluateActionsResponse>('/api/v1/actions/evaluate', { method: 'POST', body: JSON.stringify(body) }, signal),
  prepareHandoff: (body: PrepareHandoffRequest, signal?: AbortSignal) => request<PrepareHandoffResponse>('/api/v1/handoff/prepare', { method: 'POST', body: JSON.stringify(body) }, signal),
}
