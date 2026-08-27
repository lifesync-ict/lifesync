import type { ActionGuidanceResult, ObligationItem, RequiredDocument, RuleEvidence } from '../features/action-guidance/types'
import type { AnalysisResult, ClarificationQuestion, ConfirmedFacts, EventCandidate, FactAnswers, FactKey, QuestionOption } from '../features/fact-confirmation/types'
import type { EvidenceBundleItem, HandoffResult, InstitutionCandidate } from '../features/institution-handoff/types'
import type { DemoProfile } from '../types/profile'
import type {
  AnalyzeFactsResponse,
  ApiActor,
  ApiConfirmedFacts,
  ApiDemoProfile,
  ApiEventCandidate,
  ApiEventType,
  ApiEvidenceBundleItem,
  ApiInstitutionCandidate,
  ApiObligationItem,
  ApiRuleEvidence,
  ConfirmFactsRequest,
  ConfirmFactsResponse,
  EvaluateActionsResponse,
  PrepareHandoffResponse,
} from './contracts'
import { resolveActionEvaluationStatus } from './actionState'
import { buildPendingActionBundleItems, canonicalDemoProfile, demoReviewDate } from './guidancePolicy'

const factKeys: FactKey[] = ['eventType', 'occurredAt', 'actor', 'documentsProvided', 'wantsWorkplaceChange']
const isFactKey = (value: string): value is FactKey => factKeys.includes(value as FactKey)

const eventFromApi = (value: ApiEventType): EventCandidate['eventType'] =>
  value === 'contract_end' ? 'contract_ended' : value === 'employer_termination_request' ? 'dismissed' : 'other'
const eventToApi = (value: EventCandidate['eventType']): ApiEventType =>
  value === 'contract_ended' ? 'contract_end' : value === 'dismissed' ? 'employer_termination_request' : 'unknown'
const actorFromApi = (value: ApiActor | null): EventCandidate['actor'] => value === 'unknown' ? null : value
const actorToApi = (value: EventCandidate['actor']): ApiActor => value === 'employer' || value === 'mutual' ? value : 'unknown'

export function profileToApi(profile: DemoProfile): ApiDemoProfile {
  return canonicalDemoProfile(profile)
}

const promptByFact: Record<FactKey, string> = {
  eventType: 'eventTypePrompt', occurredAt: 'occurredAtPrompt', actor: 'actorPrompt',
  documentsProvided: 'documentsPrompt', wantsWorkplaceChange: 'changePrompt',
}
const reasonByFact: Record<FactKey, string> = {
  eventType: 'eventTypeReason', occurredAt: 'occurredAtReason', actor: 'actorReason',
  documentsProvided: 'documentsReason', wantsWorkplaceChange: 'changeReason',
}

function optionFromApi(factKey: FactKey, key: string): QuestionOption {
  if (factKey === 'eventType') {
    if (key.includes('contract')) return { value: 'contract_ended', labelKey: 'contractEnded' }
    if (key.includes('employer') || key.includes('termination')) return { value: 'dismissed', labelKey: 'dismissed' }
    return { value: 'other', labelKey: 'other' }
  }
  if (factKey === 'actor') {
    if (key.includes('employer')) return { value: 'employer', labelKey: 'actorEmployer' }
    if (key.includes('mutual')) return { value: 'mutual', labelKey: 'actorMutual' }
    return { value: 'unknown', labelKey: 'actorUnknown' }
  }
  if (factKey === 'documentsProvided') {
    if (key.includes('not') || key.includes('no')) return { value: 'no', labelKey: 'no' }
    if (key.includes('unknown')) return { value: 'unknown', labelKey: 'unknown' }
    return { value: 'yes', labelKey: 'yes' }
  }
  if (factKey === 'wantsWorkplaceChange') {
    if (key.includes('not') || key.endsWith('_no')) return { value: 'no', labelKey: 'no' }
    if (key.includes('undecided') || key.includes('unknown')) return { value: 'undecided', labelKey: 'undecided' }
    return { value: 'yes', labelKey: 'yes' }
  }
  return { value: key, labelKey: key }
}

function questionFromApi(question: AnalyzeFactsResponse['questions'][number]): ClarificationQuestion | null {
  if (!isFactKey(question.factKey)) return null
  return {
    id: question.id,
    factKey: question.factKey,
    prompt: promptByFact[question.factKey],
    reason: reasonByFact[question.factKey],
    required: question.required,
    options: question.optionKeys.map((key) => optionFromApi(question.factKey as FactKey, key)),
  }
}

export function analysisFromApi(response: AnalyzeFactsResponse): AnalysisResult {
  const missingFacts = response.eventCandidate.missingFacts.filter(isFactKey)
  const usedFallback = response.warnings.some((warning) => warning.includes('fallback') || warning.startsWith('ai_provider_'))
  return {
    origin: 'api',
    status: usedFallback ? 'review_required' : response.status,
    candidate: {
      eventType: eventFromApi(response.eventCandidate.eventType),
      occurredAt: response.eventCandidate.occurredAt,
      actor: actorFromApi(response.eventCandidate.actor),
      reasonCode: response.eventCandidate.reasonCode === 'employer_request' ? 'employer_request' : response.eventCandidate.reasonCode === 'contract_end' ? 'contract_end' : 'unknown',
      wantsWorkplaceChange: response.eventCandidate.wantsWorkplaceChange,
      documentsProvided: response.eventCandidate.documentsProvided,
      confidence: response.eventCandidate.confidence,
      sourceText: response.eventCandidate.sourceText,
      missingFacts,
    },
    questions: response.questions.map(questionFromApi).filter((question): question is ClarificationQuestion => question !== null),
  }
}

function answerFor(key: FactKey, questions: ClarificationQuestion[], answers: FactAnswers) {
  const question = questions.find((item) => item.factKey === key)
  return question ? answers[question.id] : undefined
}

export function buildDraftFacts(candidate: EventCandidate, questions: ClarificationQuestion[], answers: FactAnswers): ConfirmedFacts {
  const eventAnswer = answerFor('eventType', questions, answers) as EventCandidate['eventType'] | undefined
  const actorAnswer = answerFor('actor', questions, answers) as EventCandidate['actor'] | undefined
  const eventType = eventAnswer ?? candidate.eventType
  const actor = actorAnswer ?? candidate.actor ?? (eventType === 'dismissed' ? 'employer' : eventType === 'contract_ended' ? 'mutual' : null)
  const changeAnswer = answerFor('wantsWorkplaceChange', questions, answers)
  const documentsAnswer = answerFor('documentsProvided', questions, answers)
  return {
    eventType,
    occurredAt: answerFor('occurredAt', questions, answers) || candidate.occurredAt,
    actor,
    reasonCode: eventType === 'dismissed' ? 'employer_request' : eventType === 'contract_ended' ? 'contract_end' : candidate.reasonCode,
    wantsWorkplaceChange: changeAnswer === undefined ? candidate.wantsWorkplaceChange : changeAnswer === 'yes' ? true : changeAnswer === 'no' ? false : null,
    documentsProvided: documentsAnswer === undefined ? candidate.documentsProvided : documentsAnswer === 'yes' ? true : documentsAnswer === 'no' ? false : null,
    sourceText: candidate.sourceText,
    confirmedAt: '',
  }
}

function candidateToApi(candidate: EventCandidate): ApiEventCandidate {
  return {
    eventType: eventToApi(candidate.eventType), occurredAt: candidate.occurredAt, actor: candidate.actor ? actorToApi(candidate.actor) : null,
    reasonCode: candidate.reasonCode, wantsWorkplaceChange: candidate.wantsWorkplaceChange,
    documentsProvided: candidate.documentsProvided, confidence: candidate.confidence,
    sourceText: candidate.sourceText, missingFacts: candidate.missingFacts,
  }
}

export function confirmationToApi(candidate: EventCandidate, questions: ClarificationQuestion[], answers: FactAnswers): ConfirmFactsRequest {
  const apiAnswers: Record<string, unknown> = {}
  questions.forEach((question) => {
    const value = answers[question.id]
    if (value === undefined) return
    if (question.factKey === 'eventType') apiAnswers.eventType = eventToApi(value as EventCandidate['eventType'])
    else if (question.factKey === 'wantsWorkplaceChange' || question.factKey === 'documentsProvided') apiAnswers[question.factKey] = value === 'yes' ? true : value === 'no' ? false : null
    else apiAnswers[question.factKey] = value
  })
  return { sourceText: candidate.sourceText, eventCandidate: candidateToApi(candidate), answers: apiAnswers, confirmedByUser: true }
}

export function confirmedFromApi(response: ConfirmFactsResponse): ConfirmedFacts {
  const facts = response.confirmedFacts
  return {
    eventType: eventFromApi(facts.eventType), occurredAt: facts.occurredAt, actor: actorFromApi(facts.actor),
    reasonCode: facts.reasonCode === 'employer_request' ? 'employer_request' : facts.reasonCode === 'contract_end' ? 'contract_end' : 'unknown',
    wantsWorkplaceChange: facts.wantsWorkplaceChange, documentsProvided: facts.documentsProvided,
    sourceText: facts.sourceText, confirmedAt: response.meta.generatedAt,
  }
}

export function confirmedToApi(facts: ConfirmedFacts): ApiConfirmedFacts {
  if (!facts.occurredAt || facts.wantsWorkplaceChange === null || facts.documentsProvided === null) throw new Error('incomplete_confirmed_facts')
  return {
    eventType: eventToApi(facts.eventType), occurredAt: facts.occurredAt, actor: actorToApi(facts.actor),
    reasonCode: facts.reasonCode, wantsWorkplaceChange: facts.wantsWorkplaceChange,
    documentsProvided: facts.documentsProvided, sourceText: facts.sourceText, confirmationStatus: 'user_confirmed',
  }
}

const obligationKeys: Record<string, [string, string]> = {
  'worker-prepare': ['workerPrepareTitle', 'workerPrepareDescription'],
  'employer-documents': ['employerDocumentsTitle', 'employerDocumentsDescription'],
  'institution-check': ['institutionCheckTitle', 'institutionCheckDescription'],
}
const guidanceKeys = {
  worker: { question: 'workerQuestion', rationale: 'workerRationale' },
  employer: { question: 'employerQuestion', rationale: 'employerRationale' },
  institution: { question: 'institutionQuestion', rationale: 'institutionRationale' },
} as const
const documentKeys: Record<string, [string, string]> = {
  'employment-event-record': ['eventRecord', 'demoDocumentNote'],
  'employment-document': ['employmentDocument', 'documentNotReceived'],
  'document-review': ['employmentDocument', 'documentNotReceived'],
}
const warningKeys: Record<string, string> = {
  expert_review_required: 'reviewRequired', demo_rules_require_official_verification: 'demoRuleWarning',
  official_check_required: 'officialCheckRequired', event_date_required: 'dateRequired',
}

const documentFromApi = (document: ApiObligationItem['requiredDocuments'][number]): RequiredDocument => {
  const mapped = documentKeys[document.id]
  return { id: document.id, name: mapped?.[0] ?? 'employmentDocument', issuer: document.issuerKey === 'worker' || document.issuerKey === 'employer' || document.issuerKey === 'institution' ? document.issuerKey : 'unknown', required: document.required, note: mapped?.[1] ?? 'demoDocumentNote' }
}
const evidenceFromApi = (evidence: ApiRuleEvidence, generatedAt: string): RuleEvidence => ({
  id: evidence.id.includes('immigration') ? 'immigration' : evidence.id.includes('moel') ? 'moel' : evidence.id.includes('eps') ? 'eps' : evidence.id,
  ruleName: evidence.ruleNameKey, issuingAgency: evidence.issuingAgencyKey, sourceTitle: evidence.sourceTitleKey,
  sourceUrl: evidence.sourceUrl ?? null, effectiveFrom: null, checkedAt: evidence.checkedAt ?? generatedAt.slice(0, 10),
  verificationStatus: evidence.verificationStatus === 'verified' ? 'verified' : 'review_required', applicabilityNote: evidence.applicabilityNoteKey,
})
const obligationFromApi = (item: ApiObligationItem, occurredAt: string | null): ObligationItem => {
  const mapped = obligationKeys[item.id]
  const defaultText = item.party === 'employer'
    ? ['employerDocumentsTitle', 'employerDocumentsDescription']
    : item.party === 'institution'
      ? ['institutionCheckTitle', 'institutionCheckDescription']
      : ['workerPrepareTitle', 'workerPrepareDescription']
  const evidenceId = item.evidenceId.includes('immigration') ? 'immigration' : item.evidenceId.includes('moel') ? 'moel' : item.evidenceId.includes('eps') ? 'eps' : item.evidenceId
  return {
    id: item.id, party: item.party, title: mapped?.[0] ?? defaultText[0], description: mapped?.[1] ?? defaultText[1],
    deadline: null, reviewDate: demoReviewDate(occurredAt), deadlineLabel: item.deadlineLabelKey, daysRemaining: null, urgency: 'unknown',
    requiredDocuments: item.requiredDocuments.map(documentFromApi), question: guidanceKeys[item.party].question,
    rationale: guidanceKeys[item.party].rationale, evidenceId, status: item.status,
  }
}

export function actionsFromApi(response: EvaluateActionsResponse, facts?: Pick<ConfirmedFacts, 'occurredAt'>): ActionGuidanceResult {
  return {
    evaluationStatus: resolveActionEvaluationStatus(response), scenarioSummary: response.scenarioSummaryKey,
    obligations: response.obligations.map((item) => obligationFromApi(item, facts?.occurredAt ?? null)), evidence: response.evidence.map((item) => evidenceFromApi(item, response.meta.generatedAt)),
    warnings: response.warnings.map((warning) => warningKeys[warning] ?? (response.status === 'review_required' ? 'reviewRequired' : 'officialCheckRequired')),
  }
}

const roleByType = { employment_center: 'employmentRole', immigration_office: 'immigrationRole', worker_support_center: 'supportRole' } as const
const reasonByType = { employment_center: 'employmentReason', immigration_office: 'immigrationReason', worker_support_center: 'supportReason' } as const
const institutionFromApi = (institution: ApiInstitutionCandidate): InstitutionCandidate => ({
  id: institution.id, type: institution.type, name: institution.name ?? '', role: roleByType[institution.type], reason: reasonByType[institution.type],
  jurisdiction: institution.jurisdiction ?? null, address: institution.address ?? null, phone: institution.phone ?? null,
  sourceUrl: institution.sourceUrl ?? null, verificationStatus: institution.verificationStatus === 'verified' ? 'verified' : 'review_required', caution: 'institutionUnverified',
})
const bundleTitleById: Record<string, string> = {
  'original-situation': 'sourceText', original_situation: 'sourceText',
  'confirmed-facts': 'confirmedFacts', confirmed_facts: 'confirmedFacts',
  'demo-profile': 'demoProfile', demo_profile: 'demoProfile',
  'action-progress': 'pendingAction', action_progress: 'pendingAction',
  'unverified-information': 'unverifiedInformation', unverified_information: 'unverifiedInformation',
}
const bundleFromApi = (item: ApiEvidenceBundleItem): EvidenceBundleItem => ({
  id: item.id,
  category: item.category === 'facts' ? 'fact' : item.category === 'actions' ? 'action' : ['situation', 'fact', 'profile', 'action', 'question', 'document', 'warning'].includes(item.category) ? item.category as EvidenceBundleItem['category'] : 'warning',
  title: bundleTitleById[item.id] ?? bundleTitleById[item.titleKey] ?? 'unverifiedInformation',
  description: bundleTitleById[item.id] === 'sourceText' ? 'sourceText' : bundleTitleById[item.id] === 'confirmedFacts' ? 'confirmedFactsDescription' : bundleTitleById[item.id] === 'demoProfile' ? 'demoProfileDescription' : bundleTitleById[item.id] === 'unverifiedInformation' ? 'unverifiedDescription' : 'pendingAction',
  included: item.included, required: item.required,
  source: ['user', 'confirmed_facts', 'action_guidance', 'demo_profile'].includes(item.source) ? item.source as EvidenceBundleItem['source'] : 'action_guidance',
})

export function handoffFromApi(response: PrepareHandoffResponse, facts: ConfirmedFacts, actions: ActionGuidanceResult, completedIds: string[], profile: DemoProfile): HandoffResult {
  const institutions = [response.primaryInstitution, ...response.alternativeInstitutions].filter((item): item is ApiInstitutionCandidate => item !== null).map(institutionFromApi)
  const completedActions = actions.obligations.filter((item) => completedIds.includes(item.id)).map((item) => item.title)
  const pendingActions = actions.obligations.filter((item) => !completedIds.includes(item.id)).map((item) => item.title)
  const apiBundle = response.evidenceBundle.map(bundleFromApi).filter((item) => item.id !== 'action-status')
  const evidenceBundle: EvidenceBundleItem[] = [
    ...apiBundle,
    ...(apiBundle.some((item) => item.category === 'profile') ? [] : [{ id: 'demo-profile', category: 'profile' as const, title: 'demoProfile', description: 'demoProfileDescription', literal: `${profile.visa} · ${profile.region} · ${profile.industry}`, included: true, required: false, source: 'demo_profile' as const }]),
    ...buildPendingActionBundleItems(actions.obligations, completedIds).map((item) => ({ ...item, category: 'action' as const, included: true, required: false, source: 'action_guidance' as const })),
    ...response.questionsToAsk.map((question, index) => ({ id: `question-${index}`, category: 'question' as const, title: 'questionForInstitution', description: question === 'question_workplace_change_reason' ? 'questionEligibility' : question === 'question_alternative_document_evidence' ? 'questionMissingDocuments' : question === 'question_visa_procedure' ? 'questionVisa' : 'questionJurisdiction', included: true, required: false, source: 'action_guidance' as const })),
    ...Array.from(new Set(actions.obligations.flatMap((item) => item.requiredDocuments.map((document) => document.name)))).map((document, index) => ({ id: `document-${index}`, category: 'document' as const, title: 'documentToCheck', description: document, included: true, required: false, source: 'action_guidance' as const })),
  ]
  return {
    status: response.status, primaryInstitution: response.primaryInstitution ? institutionFromApi(response.primaryInstitution) : null,
    alternativeInstitutions: response.alternativeInstitutions.map(institutionFromApi), evidenceBundle,
    summary: {
      situationSummary: facts.sourceText, confirmedFacts: facts, completedActions, pendingActions,
      questionsToAsk: response.questionsToAsk, documentsToBring: actions.obligations.flatMap((item) => item.requiredDocuments.map((document) => document.name)),
      institutions, generatedAt: response.meta.generatedAt, disclaimer: response.privacyNoticeKey,
    },
    warnings: response.warnings.filter((warning) => warning === 'no_personal_information_included').map(() => 'noPersonalData'),
  }
}
