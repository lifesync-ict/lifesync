import type { ConfirmedFacts } from '../fact-confirmation/types'
import type { DemoProfile } from '../../types/profile'
import { addDays, getDeadlineState } from './dateUtils'
import type { ActionGuidanceResult, ObligationItem, ResponsibleParty, RuleEvidence } from './types'

const DEMO_CHECKED_AT = '2026-08-25'
const makeEvidence = (id: string, agency: string, sourceTitle: string): RuleEvidence => ({ id, ruleName: `demo-review-${id}`, issuingAgency: agency, sourceTitle, sourceUrl: null, effectiveFrom: null, checkedAt: DEMO_CHECKED_AT, verificationStatus: 'review_required', applicabilityNote: 'demoApplicability' })
const evidence = [makeEvidence('moel', 'MOEL', 'MOEL guidance placeholder'), makeEvidence('eps', 'EPS', 'EPS guidance placeholder'), makeEvidence('immigration', 'IMMIGRATION', 'Immigration guidance placeholder')]

function makeObligation(id: string, party: ResponsibleParty, title: string, description: string, eventDate: string, offset: number, evidenceId: string): ObligationItem {
  const deadline = addDays(eventDate, offset); const state = getDeadlineState(deadline)
  return { id, party, title, description, deadline, deadlineLabel: 'demoReviewDate', ...state, evidenceId, status: 'pending', requiredDocuments: [] }
}

export async function evaluateActionGuidance(facts: ConfirmedFacts, profile: DemoProfile): Promise<ActionGuidanceResult> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  if (facts.sourceText.includes('[rule-error]')) throw new Error('MOCK_RULE_ERROR')
  const supported = profile.visa === 'E-9' && profile.industry === 'Manufacturing' && profile.region.includes('Eumseong') && (facts.eventType === 'dismissed' || facts.eventType === 'contract_ended') && facts.wantsWorkplaceChange === true
  if (!supported) return { evaluationStatus: 'needs_review', scenarioSummary: 'unsupportedScenario', obligations: [], evidence, warnings: ['reviewRequired'] }
  if (!facts.occurredAt) return { evaluationStatus: 'needs_review', scenarioSummary: 'dateMissing', obligations: [], evidence, warnings: ['dateRequired'] }

  const obligations = [
    makeObligation('worker-prepare', 'worker', 'workerPrepareTitle', 'workerPrepareDescription', facts.occurredAt, 14, 'eps'),
    makeObligation('institution-check', 'institution', 'institutionCheckTitle', 'institutionCheckDescription', facts.occurredAt, 14, 'immigration'),
  ]
  obligations[0].requiredDocuments = [{ id: 'employment-event-record', name: 'eventRecord', issuer: 'worker', required: true, note: 'demoDocumentNote' }]
  if (facts.documentsProvided === false) {
    const employer = makeObligation('employer-documents', 'employer', 'employerDocumentsTitle', 'employerDocumentsDescription', facts.occurredAt, 7, 'moel')
    employer.requiredDocuments = [{ id: 'employment-document', name: 'employmentDocument', issuer: 'employer', required: true, note: 'documentNotReceived' }]
    obligations.splice(1, 0, employer)
  }
  return { evaluationStatus: 'complete', scenarioSummary: facts.eventType ?? 'unsupportedScenario', obligations, evidence, warnings: ['demoRuleWarning', 'officialCheckRequired'] }
}
