export type MappedQuestionOption = { value: string; labelKey: string }

export function optionFromApi(factKey: string, key: string): MappedQuestionOption {
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
    if (key === 'no' || key.includes('not') || key.endsWith('_no')) return { value: 'no', labelKey: 'no' }
    if (key.includes('undecided') || key.includes('unknown')) return { value: 'undecided', labelKey: 'undecided' }
    return { value: 'yes', labelKey: 'yes' }
  }
  return { value: key, labelKey: key }
}
