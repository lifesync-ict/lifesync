import type { EvaluateActionsResponse } from './contracts'
import type { RuleEvaluationStatus } from '../features/action-guidance/types'

export function resolveActionEvaluationStatus(response: Pick<EvaluateActionsResponse, 'status' | 'obligations'>): RuleEvaluationStatus {
  if (response.obligations.length > 0) return 'complete'
  return 'needs_review'
}
