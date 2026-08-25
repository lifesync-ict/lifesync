import { AlertTriangle, ArrowLeft, ArrowRight, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { StatusSection } from '../components/StatusSection'
import { translations, type LanguageCode } from '../data/translations'
import { analyzeSituation, buildConfirmedFacts } from '../features/fact-confirmation/mockFactAnalysis'
import { formatFactValue } from '../features/fact-confirmation/formatters'
import { factStorage } from '../features/fact-confirmation/storage'
import { factTranslations } from '../features/fact-confirmation/translations'
import type { AnalysisResult, AnalysisStatus, FactAnswers, FactKey } from '../features/fact-confirmation/types'
import { SITUATION_KEY } from './SituationPage'
import { invalidateAfterFactChange, normalizeSourceText, prepareSourceSession } from '../features/sessionLifecycle'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }

export function ConfirmPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate()
  const sourceText = normalizeSourceText(sessionStorage.getItem(SITUATION_KEY) ?? '')
  const [initialState] = useState(() => {
    if (!sourceText) return { analysis: null }
    prepareSourceSession(sourceText)
    return { analysis: factStorage.getAnalysis() }
  })
  const [status, setStatus] = useState<AnalysisStatus>(initialState.analysis?.status ?? 'analyzing')
  const [result, setResult] = useState<AnalysisResult | null>(initialState.analysis)
  const [answers, setAnswers] = useState<FactAnswers>(factStorage.getAnswers)
  const [questionIndex, setQuestionIndex] = useState(factStorage.getQuestionIndex)
  const [isEditingQuestions, setIsEditingQuestions] = useState(factStorage.getQuestionEditing)
  const [showError, setShowError] = useState(false)
  const content = translations[language]
  const copy = factTranslations[language]

  useEffect(() => {
    if (!sourceText || result) return
    let active = true
    analyzeSituation(sourceText)
      .then((analysis) => { if (active) { factStorage.saveAnalysis(analysis); setResult(analysis); setStatus(analysis.status) } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [sourceText, result])

  const retryAnalysis = async () => {
    if (!sourceText) return
    setStatus('analyzing'); setShowError(false)
    try { const analysis = await analyzeSituation(sourceText); factStorage.saveAnalysis(analysis); setResult(analysis); setStatus(analysis.status) }
    catch { setStatus('error') }
  }

  const questions = result?.questions ?? []
  const safeIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0))
  const currentQuestion = questions[safeIndex]
  const allRequiredAnswered = questions.every((question) => !question.required || Boolean(answers[question.id]))
  const facts = useMemo(() => result ? buildConfirmedFacts(result.candidate, answers) : null, [result, answers])

  if (!sourceText) return <Navigate to="/situation" replace />

  const saveAnswer = (id: string, value: string) => {
    const next = { ...answers, [id]: value }; invalidateAfterFactChange(); setAnswers(next); factStorage.saveAnswers(next); setShowError(false)
  }
  const moveQuestion = (direction: number) => {
    if (direction > 0 && currentQuestion?.required && !answers[currentQuestion.id]) { setShowError(true); return }
    if (direction > 0 && safeIndex === questions.length - 1) { setIsEditingQuestions(false); factStorage.saveQuestionEditing(false); return }
    const next = Math.max(0, Math.min(safeIndex + direction, questions.length - 1)); setQuestionIndex(next); factStorage.saveQuestionIndex(next)
  }
  const confirmFacts = () => {
    if (!facts || !allRequiredAnswered) { setShowError(true); return }
    factStorage.saveConfirmed(facts); factStorage.saveQuestionEditing(false); setStatus('confirmed'); navigate('/actions')
  }
  const factValue = (key: FactKey | 'actor') => {
    if (!facts) return copy.notConfirmed
    const value = facts[key]
    return formatFactValue(key, value, copy)
  }
  const pageTitle = status === 'analyzing' ? copy.loading : status === 'error' ? copy.errorTitle : status === 'review_required' ? copy.reviewTitle : allRequiredAnswered ? copy.summaryTitle : copy.title
  const contextSummary = result && facts ? <section className="candidate-panel" aria-labelledby="candidate-title"><h2 id="candidate-title">{copy.candidateTitle}</h2><dl>
    {(['eventType', 'occurredAt', 'actor', 'documentsProvided', 'wantsWorkplaceChange'] as const).map((key) => <div key={key}><dt>{copy.facts[key]}</dt><dd className={facts[key] === null ? 'unknown' : ''}>{factValue(key)}</dd></div>)}
  </dl><div className="source-text"><span>{copy.sourceLabel}</span><q>{sourceText}</q></div></section> : <section className="source-context"><span>{copy.sourceLabel}</span><q>{sourceText}</q></section>

  return <main className="flow-shell" lang={language}>
    <AppHeader language={language} onLanguageChange={onLanguageChange} />
    <div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={1} /></div>
    <section className="fact-layout" aria-live="polite">
      <header className="fact-heading"><h1>{pageTitle}</h1><p>{status === 'analyzing' ? copy.loadingDetail : status === 'error' ? copy.errorMessage : status === 'review_required' ? copy.reviewMessage : copy.description}</p></header>
      {contextSummary}
      {status === 'analyzing' && <StatusSection icon={<LoaderCircle className="loading-icon" />} badge={copy.status.analyzing} title={copy.loading} description={copy.loadingDetail} />}
      {status === 'error' && <StatusSection icon={<AlertTriangle />} badge={copy.status.error} tone="error" title={copy.errorTitle} description={copy.errorMessage} actions={<><button className="next-button" type="button" onClick={() => void retryAnalysis()}><RefreshCw size={17} aria-hidden="true" />{copy.retry}</button><button className="back-button" type="button" onClick={() => navigate('/situation')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToSituation}</button></>} />}
      {status === 'review_required' && <StatusSection icon={<AlertTriangle />} badge={copy.status.review_required} tone="warning" title={copy.reviewTitle} description={copy.reviewMessage} detail={result?.candidate.missingFacts.length ? <ul>{result.candidate.missingFacts.map((fact) => <li key={fact}>{copy.facts[fact]}</li>)}</ul> : undefined} actions={<><button className="back-button" type="button" onClick={() => navigate('/situation')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToSituation}</button><button className="next-button" type="button" onClick={() => void retryAnalysis()}><RefreshCw size={17} aria-hidden="true" />{copy.retry}</button></>} />}

      {(status === 'needs_input' || status === 'ready_to_confirm') && result && facts && <>
        {(!allRequiredAnswered || isEditingQuestions) && currentQuestion && <section className="question-panel workflow-panel" aria-labelledby="question-title"><p className="question-count">{safeIndex + 1} / {questions.length}</p><form onSubmit={(event) => { event.preventDefault(); moveQuestion(1) }}>
          <fieldset><legend id="question-title">{copy.questions[currentQuestion.prompt]}</legend>
            {currentQuestion.factKey === 'occurredAt' ? <label className="date-answer"><span>{copy.questions[currentQuestion.prompt]}</span><input type="date" value={answers[currentQuestion.id] ?? ''} onChange={(event) => saveAnswer(currentQuestion.id, event.target.value)} required /></label> : <div className="answer-options">{currentQuestion.options.map((option) => <label key={option.value}><input type="radio" name={currentQuestion.id} value={option.value} checked={answers[currentQuestion.id] === option.value} onChange={() => saveAnswer(currentQuestion.id, option.value)} /><span>{currentQuestion.factKey === 'documentsProvided' ? formatFactValue('documentsProvided', option.value, copy) : copy.options[option.labelKey]}</span></label>)}</div>}
          </fieldset><details><summary>{copy.why}</summary><p>{copy.reasons[currentQuestion.reason]}</p></details><p className="question-error" aria-live="assertive">{showError ? copy.requiredError : ''}</p>
          <div className="question-actions"><button className="back-button" type="button" disabled={safeIndex === 0} onClick={() => moveQuestion(-1)}><ArrowLeft size={17} aria-hidden="true" />{copy.previous}</button><button className="next-button" type="submit" disabled={!answers[currentQuestion.id]}>{copy.next}<ArrowRight size={17} aria-hidden="true" /></button></div>
        </form></section>}

        {allRequiredAnswered && !isEditingQuestions && <section className="fact-summary workflow-panel" aria-labelledby="summary-title"><ShieldCheck aria-hidden="true" /><h2 id="summary-title">{copy.summaryTitle}</h2><p>{copy.summaryDescription}</p><dl>{(['eventType', 'occurredAt', 'actor', 'documentsProvided', 'wantsWorkplaceChange'] as const).map((key) => <div key={key}><dt>{copy.facts[key]}</dt><dd>{factValue(key)}</dd></div>)}</dl><div className="summary-actions"><button className="back-button" type="button" onClick={() => { if (!questions.length) { navigate('/situation'); return }; const last = questions.length - 1; setQuestionIndex(last); factStorage.saveQuestionIndex(last); setIsEditingQuestions(true); factStorage.saveQuestionEditing(true) }}><ArrowLeft size={17} aria-hidden="true" />{questions.length ? copy.previous : copy.backToSituation}</button><button className="next-button" type="button" onClick={confirmFacts}>{copy.confirm}<ArrowRight size={17} aria-hidden="true" /></button></div></section>}
      </>}
    </section>
  </main>
}
