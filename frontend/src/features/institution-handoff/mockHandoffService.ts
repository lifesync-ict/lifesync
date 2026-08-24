import type { ActionGuidanceResult } from '../action-guidance/types'
import type { ConfirmedFacts } from '../fact-confirmation/types'
import type { DemoProfile } from '../../types/profile'
import type { EvidenceBundleItem, HandoffResult, InstitutionCandidate, InstitutionType } from './types'

const institution = (id: string, type: InstitutionType, role: string, reason: string): InstitutionCandidate => ({ id, type, name: type, role, reason, jurisdiction: null, address: null, phone: null, sourceUrl: null, verificationStatus: 'review_required', caution: 'institutionUnverified' })
export async function prepareHandoff(facts: ConfirmedFacts, actions: ActionGuidanceResult, profile: DemoProfile, completed: string[]): Promise<HandoffResult> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  if (facts.sourceText.includes('[handoff-error]')) throw new Error('MOCK_HANDOFF_ERROR')
  const institutions = [institution('employment-candidate', 'employment_center', 'employmentRole', 'employmentReason'), institution('immigration-candidate', 'immigration_office', 'immigrationRole', 'immigrationReason'), institution('support-candidate', 'worker_support_center', 'supportRole', 'supportReason')]
  const supported = profile.visa === 'E-9' && profile.industry === 'Manufacturing' && profile.region.includes('Eumseong') && facts.wantsWorkplaceChange === true
  const completedActions = actions.obligations.filter((item) => completed.includes(item.id)).map((item) => item.title)
  const pendingActions = actions.obligations.filter((item) => !completed.includes(item.id)).map((item) => item.title)
  const questions = ['questionEligibility', ...(facts.documentsProvided === false ? ['questionMissingDocuments'] : []), 'questionVisa', 'questionJurisdiction']
  const documents = Array.from(new Set(actions.obligations.flatMap((item) => item.requiredDocuments.map((doc) => doc.name))))
  const bundle: EvidenceBundleItem[] = [
    { id: 'source-text', category: 'situation', title: 'sourceText', description: facts.sourceText, included: true, required: true, source: 'user' },
    { id: 'confirmed-facts', category: 'fact', title: 'confirmedFacts', description: 'confirmedFactsDescription', included: true, required: true, source: 'confirmed_facts' },
    { id: 'demo-profile', category: 'profile', title: 'demoProfile', description: 'demoProfileDescription', included: true, required: false, source: 'demo_profile' },
    ...completedActions.map((title, index) => ({ id: `completed-${index}`, category: 'action' as const, title, description: 'completedAction', included: true, required: false, source: 'action_guidance' as const })),
    ...pendingActions.map((title, index) => ({ id: `pending-${index}`, category: 'action' as const, title, description: 'pendingAction', included: true, required: false, source: 'action_guidance' as const })),
    ...questions.map((title, index) => ({ id: `question-${index}`, category: 'question' as const, title, description: 'questionForInstitution', included: true, required: false, source: 'action_guidance' as const })),
    ...documents.map((title, index) => ({ id: `document-${index}`, category: 'document' as const, title, description: 'documentToCheck', included: true, required: false, source: 'action_guidance' as const })),
    { id: 'unverified-warning', category: 'warning', title: 'unverifiedInformation', description: 'unverifiedDescription', included: true, required: true, source: 'action_guidance' },
  ]
  return { status: supported && actions.obligations.length ? 'ready' : 'needs_review', primaryInstitution: supported ? institutions[0] : null, alternativeInstitutions: supported ? institutions.slice(1) : institutions, evidenceBundle: bundle, summary: { situationSummary: facts.sourceText, confirmedFacts: facts, completedActions, pendingActions, questionsToAsk: questions, documentsToBring: documents, institutions, generatedAt: new Date().toISOString(), disclaimer: 'demoOnlyDisclaimer' }, warnings: ['noSubmission', 'institutionUnverified', 'noPersonalData'] }
}
