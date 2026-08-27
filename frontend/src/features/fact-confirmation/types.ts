export type AnalysisStatus = 'analyzing' | 'needs_input' | 'ready_to_confirm' | 'confirmed' | 'review_required' | 'error'

export type FactKey = 'eventType' | 'occurredAt' | 'employmentContractEndedAt' | 'actor' | 'documentsProvided' | 'wantsWorkplaceChange'

export type EventCandidate = {
  eventType: 'contract_ended' | 'dismissed' | 'other' | null
  occurredAt: string | null
  employmentContractEndedAt: string | null
  actor: 'employer' | 'worker' | 'mutual' | null
  reasonCode: 'contract_end' | 'employer_request' | 'unknown' | null
  wantsWorkplaceChange: boolean | null
  documentsProvided: boolean | null
  confidence: number
  sourceText: string
  missingFacts: FactKey[]
}

export type QuestionOption = { value: string; labelKey: string }
export type ClarificationQuestion = {
  id: string
  factKey: FactKey
  prompt: string
  options: QuestionOption[]
  reason: string
  required: boolean
}

export type FactAnswers = Record<string, string>

export type ConfirmedFacts = {
  eventType: EventCandidate['eventType']
  occurredAt: string | null
  employmentContractEndedAt: string | null
  actor: EventCandidate['actor']
  reasonCode: EventCandidate['reasonCode']
  wantsWorkplaceChange: boolean | null
  documentsProvided: boolean | null
  sourceText: string
  confirmedAt: string
}

export type AnalysisResult = {
  origin?: 'api'
  status: Exclude<AnalysisStatus, 'analyzing' | 'confirmed'>
  candidate: EventCandidate
  questions: ClarificationQuestion[]
}
