import type { AnalysisResult, ConfirmedFacts, FactAnswers } from './types'

const ANSWERS_KEY = 'lifesync-fact-answers'
const QUESTION_INDEX_KEY = 'lifesync-fact-question-index'
const QUESTION_EDITING_KEY = 'lifesync-fact-question-editing'
const ANALYSIS_KEY = 'lifesync-fact-analysis'
export const CONFIRMED_FACTS_KEY = 'lifesync-confirmed-facts'

function readJson<T>(key: string, fallback: T): T {
  try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

export const factStorage = {
  getAnalysis: () => {
    const analysis = readJson<AnalysisResult | null>(ANALYSIS_KEY, null)
    return analysis?.origin === 'api' ? analysis : null
  },
  saveAnalysis: (analysis: AnalysisResult) => sessionStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis)),
  getAnswers: () => readJson<FactAnswers>(ANSWERS_KEY, {}),
  saveAnswers: (answers: FactAnswers) => sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers)),
  getQuestionIndex: () => Number(sessionStorage.getItem(QUESTION_INDEX_KEY) ?? 0),
  saveQuestionIndex: (index: number) => sessionStorage.setItem(QUESTION_INDEX_KEY, String(index)),
  getQuestionEditing: () => sessionStorage.getItem(QUESTION_EDITING_KEY) === 'true',
  saveQuestionEditing: (editing: boolean) => sessionStorage.setItem(QUESTION_EDITING_KEY, String(editing)),
  getConfirmed: () => readJson<ConfirmedFacts | null>(CONFIRMED_FACTS_KEY, null),
  saveConfirmed: (facts: ConfirmedFacts) => sessionStorage.setItem(CONFIRMED_FACTS_KEY, JSON.stringify(facts)),
  clearConfirmed: () => sessionStorage.removeItem(CONFIRMED_FACTS_KEY),
}
