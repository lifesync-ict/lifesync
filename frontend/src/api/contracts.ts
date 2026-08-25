export type ApiLanguageCode = 'ko' | 'en' | 'vi' | 'ne'
export type ApiVerificationStatus = 'verified' | 'review_required' | 'unavailable'
export type ApiEventType = 'contract_end' | 'employer_termination_request' | 'unknown'
export type ApiActor = 'employer' | 'mutual' | 'unknown'

export type ApiMeta = {
  requestId: string
  schemaVersion: string
  generatedAt: string
  demoOnly: boolean
  verificationStatus: ApiVerificationStatus
}

export type ApiDemoProfile = {
  visaType: string
  nationality: string
  region: string
  industry: string
}

export type ApiEventCandidate = {
  eventType: ApiEventType
  occurredAt: string | null
  actor: ApiActor | null
  reasonCode: string | null
  wantsWorkplaceChange: boolean | null
  documentsProvided: boolean | null
  confidence: number
  sourceText: string
  missingFacts: string[]
}

export type ApiClarificationQuestion = {
  id: string
  factKey: string
  promptKey: string
  optionKeys: string[]
  reasonKey: string
  required: boolean
  inputType: 'single_choice' | 'date'
}

export type AnalyzeFactsRequest = { text: string; language: ApiLanguageCode; profile: ApiDemoProfile }
export type AnalyzeFactsResponse = {
  status: 'needs_input' | 'ready_to_confirm' | 'review_required'
  eventCandidate: ApiEventCandidate
  questions: ApiClarificationQuestion[]
  warnings: string[]
  meta: ApiMeta
}

export type ApiConfirmedFacts = {
  eventType: ApiEventType
  occurredAt: string
  actor: ApiActor
  reasonCode: string | null
  wantsWorkplaceChange: boolean
  documentsProvided: boolean
  sourceText: string
  confirmationStatus: 'user_confirmed'
}

export type ConfirmFactsRequest = {
  sourceText: string
  eventCandidate: ApiEventCandidate
  answers: Record<string, unknown>
  confirmedByUser: boolean
}
export type ConfirmFactsResponse = { status: 'confirmed'; confirmedFacts: ApiConfirmedFacts; meta: ApiMeta }

export type ApiRequiredDocument = { id: string; nameKey: string; issuerKey?: string | null; required: boolean; noteKey: string }
export type ApiRuleEvidence = {
  id: string
  ruleNameKey: string
  issuingAgencyKey: string
  sourceTitleKey: string
  sourceUrl?: string | null
  effectiveFrom?: null
  checkedAt?: null
  verificationStatus: ApiVerificationStatus
  applicabilityNoteKey: string
}
export type ApiObligationItem = {
  id: string
  party: 'worker' | 'employer' | 'institution'
  titleKey: string
  descriptionKey: string
  deadline?: null
  deadlineLabelKey: string
  daysRemaining?: null
  urgency: 'unknown'
  requiredDocuments: ApiRequiredDocument[]
  evidenceId: string
  status: 'pending'
}
export type EvaluateActionsRequest = { confirmedFacts: ApiConfirmedFacts; profile: ApiDemoProfile }
export type EvaluateActionsResponse = {
  status: 'complete' | 'review_required'
  scenarioSummaryKey: string
  obligations: ApiObligationItem[]
  evidence: ApiRuleEvidence[]
  warnings: string[]
  meta: ApiMeta
}

export type ApiInstitutionCandidate = {
  id: string
  type: 'employment_center' | 'immigration_office' | 'worker_support_center'
  name?: string | null
  roleKey: string
  reasonKey: string
  jurisdiction?: string | null
  address?: string | null
  phone?: string | null
  sourceUrl?: string | null
  verificationStatus: ApiVerificationStatus
  cautionKey: string
}
export type ApiEvidenceBundleItem = {
  id: string
  category: string
  titleKey: string
  descriptionKey: string
  included: boolean
  required: boolean
  source: string
}
export type PrepareHandoffRequest = {
  confirmedFacts: ApiConfirmedFacts
  profile: ApiDemoProfile
  actionGuidance: EvaluateActionsResponse
  completedActionIds?: string[]
  selectedEvidenceItemIds?: string[]
}
export type PrepareHandoffResponse = {
  status: 'ready' | 'needs_review'
  primaryInstitution: ApiInstitutionCandidate | null
  alternativeInstitutions: ApiInstitutionCandidate[]
  evidenceBundle: ApiEvidenceBundleItem[]
  questionsToAsk: string[]
  privacyNoticeKey: string
  warnings: string[]
  meta: ApiMeta
}

export type ReadyResponse = { status: string; service: string; version: string; provider: string; providerConfigured: boolean }
