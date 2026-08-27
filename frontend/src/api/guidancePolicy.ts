export function demoReviewDate(occurredAt: string | null): string | null {
  return occurredAt || null
}

export function canShowOfficialEvidence(sourceUrl: string | null, verificationStatus: string): boolean {
  return Boolean(sourceUrl) && verificationStatus === 'verified'
}

export function containsInternalDisplayValue(value: string): boolean {
  return /placeholder|demo-review-|^[A-Z][A-Z_]+$/.test(value)
}

export function buildPendingActionBundleItems<T extends { id: string; title: string; description: string }>(items: T[], completedIds: string[]) {
  return items.filter((item) => !completedIds.includes(item.id)).map((item) => ({ id: `action-${item.id}`, title: item.title, description: item.description }))
}

export function shouldShowSharedHandoffNotice(status: string): boolean {
  return status === 'ready' || status === 'needs_review'
}

export function canonicalDemoProfile(profile: { visa: string; nationality: string; region: string; industry: string }) {
  return {
    visaType: profile.visa,
    nationality: /^vietnam$/i.test(profile.nationality) ? '베트남' : profile.nationality,
    region: /eumseong/i.test(profile.region) ? '충북 음성군' : profile.region,
    industry: /manufacturing/i.test(profile.industry) ? '제조업' : profile.industry,
  }
}
