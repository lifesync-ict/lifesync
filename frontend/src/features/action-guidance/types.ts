export type RuleEvaluationStatus = 'evaluating' | 'complete' | 'needs_review' | 'error'
export type ResponsibleParty = 'worker' | 'employer' | 'institution'
export type Urgency = 'overdue' | 'today' | 'urgent' | 'normal' | 'unknown'

export type RequiredDocument = { id: string; name: string; issuer: ResponsibleParty | 'unknown'; required: boolean; note: string }
export type ObligationItem = {
  id: string; party: ResponsibleParty; title: string; description: string; deadline: string | null
  deadlineLabel: string; daysRemaining: number | null; urgency: Urgency; requiredDocuments: RequiredDocument[]
  evidenceId: string; status: 'pending' | 'completed'
}
export type RuleEvidence = {
  id: string; ruleName: string; issuingAgency: string; sourceTitle: string; sourceUrl: string | null
  effectiveFrom: string | null; checkedAt: string; verificationStatus: 'verified' | 'review_required'
  applicabilityNote: string
}
export type ActionGuidanceResult = {
  evaluationStatus: RuleEvaluationStatus; scenarioSummary: string; obligations: ObligationItem[]
  evidence: RuleEvidence[]; warnings: string[]
}
