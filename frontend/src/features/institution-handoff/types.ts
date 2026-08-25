import type { ConfirmedFacts } from '../fact-confirmation/types'

export type HandoffStatus = 'preparing' | 'ready' | 'needs_review' | 'error'
export type InstitutionType = 'employment_center' | 'immigration_office' | 'worker_support_center'
export type InstitutionCandidate = { id: string; type: InstitutionType; name: string; role: string; reason: string; jurisdiction: string | null; address: string | null; phone: string | null; sourceUrl: string | null; verificationStatus: 'verified' | 'review_required'; caution: string }
export type EvidenceBundleItem = { id: string; category: 'situation' | 'fact' | 'profile' | 'action' | 'question' | 'document' | 'warning'; title: string; description: string; included: boolean; required: boolean; source: 'user' | 'confirmed_facts' | 'action_guidance' | 'demo_profile' }
export type HandoffSummary = { situationSummary: string; confirmedFacts: ConfirmedFacts; completedActions: string[]; pendingActions: string[]; questionsToAsk: string[]; documentsToBring: string[]; institutions: InstitutionCandidate[]; generatedAt: string; disclaimer: string }
export type HandoffResult = { status: HandoffStatus; primaryInstitution: InstitutionCandidate | null; alternativeInstitutions: InstitutionCandidate[]; evidenceBundle: EvidenceBundleItem[]; summary: HandoffSummary; warnings: string[] }
