import type { AnalysisResult, ClarificationQuestion, EventCandidate, FactKey } from './types'

const contains = (text: string, terms: string[]) => terms.some((term) => text.toLowerCase().includes(term.toLowerCase()))

const questionDefinitions: Record<FactKey, ClarificationQuestion> = {
  eventType: { id: 'eventType', factKey: 'eventType', prompt: 'eventTypePrompt', reason: 'eventTypeReason', required: true, options: [{ value: 'contract_ended', labelKey: 'contractEnded' }, { value: 'dismissed', labelKey: 'dismissed' }, { value: 'other', labelKey: 'other' }] },
  occurredAt: { id: 'occurredAt', factKey: 'occurredAt', prompt: 'occurredAtPrompt', reason: 'occurredAtReason', required: true, options: [] },
  documentsProvided: { id: 'documentsProvided', factKey: 'documentsProvided', prompt: 'documentsPrompt', reason: 'documentsReason', required: true, options: [{ value: 'yes', labelKey: 'yes' }, { value: 'no', labelKey: 'no' }, { value: 'unknown', labelKey: 'unknown' }] },
  wantsWorkplaceChange: { id: 'wantsWorkplaceChange', factKey: 'wantsWorkplaceChange', prompt: 'changePrompt', reason: 'changeReason', required: true, options: [{ value: 'yes', labelKey: 'yes' }, { value: 'no', labelKey: 'no' }, { value: 'undecided', labelKey: 'undecided' }] },
}

export async function analyzeSituation(sourceText: string): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  if (sourceText.includes('[error]')) throw new Error('MOCK_ANALYSIS_ERROR')

  const dismissed = contains(sourceText, ['그만 나오', '해고', '나오지 마', 'not to come back', 'fired', 'không cần đi làm', 'अब काममा नआउन'])
  const contractEnded = contains(sourceText, ['계약이 끝', '계약 만료', 'contract ended', 'hợp đồng đã hết', 'सम्झौता सकियो'])
  const wantsChange = contains(sourceText, ['옮기고 싶', '사업장 변경', 'another company', 'chuyển sang công ty', 'अर्को कम्पनी'])
  const documentsDenied = contains(sourceText, ['서류를 주지', 'documents i need', 'không đưa', 'कागजात दिइरहेका छैनन्'])
  const dateMatch = sourceText.match(/(20\d{2})[-./년\s](0?[1-9]|1[0-2])[-./월\s](0?[1-9]|[12]\d|3[01])/)

  const candidate: EventCandidate = {
    eventType: dismissed ? 'dismissed' : contractEnded ? 'contract_ended' : null,
    occurredAt: dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}` : null,
    actor: dismissed ? 'employer' : contractEnded ? 'mutual' : null,
    reasonCode: dismissed ? 'employer_request' : contractEnded ? 'contract_end' : 'unknown',
    wantsWorkplaceChange: wantsChange ? true : null,
    documentsProvided: documentsDenied ? false : null,
    confidence: dismissed || contractEnded ? 0.82 : 0.38,
    sourceText,
    missingFacts: [],
  }
  candidate.missingFacts = (Object.keys(questionDefinitions) as FactKey[]).filter((key) => candidate[key] === null)
  const questions = candidate.missingFacts.map((key) => questionDefinitions[key])
  const reviewRequired = sourceText.includes('[review]') || sourceText.trim().length < 8
  return { status: reviewRequired ? 'review_required' : questions.length ? 'needs_input' : 'ready_to_confirm', candidate, questions }
}

export function buildConfirmedFacts(candidate: EventCandidate, answers: Record<string, string>) {
  const eventType = (answers.eventType as EventCandidate['eventType']) ?? candidate.eventType
  return {
    eventType,
    occurredAt: answers.occurredAt || candidate.occurredAt,
    actor: eventType === 'dismissed' ? 'employer' as const : candidate.actor,
    reasonCode: eventType === 'dismissed' ? 'employer_request' as const : eventType === 'contract_ended' ? 'contract_end' as const : candidate.reasonCode,
    wantsWorkplaceChange: answers.wantsWorkplaceChange ? answers.wantsWorkplaceChange === 'yes' : candidate.wantsWorkplaceChange,
    documentsProvided: answers.documentsProvided ? answers.documentsProvided === 'yes' : candidate.documentsProvided,
    sourceText: candidate.sourceText,
    confirmedAt: new Date().toISOString(),
  }
}
