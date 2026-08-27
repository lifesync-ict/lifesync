import { AlertTriangle, ArrowLeft, ArrowRight, FileText, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { StatusSection } from '../components/StatusSection'
import { translations, type LanguageCode } from '../data/translations'
import { apiClient } from '../api/client'
import { actionsFromApi, confirmedToApi, profileToApi } from '../api/adapters'
import { canShowOfficialEvidence } from '../api/guidancePolicy'
import { formatDate } from '../features/action-guidance/dateUtils'
import { actionStorage } from '../features/action-guidance/storage'
import { actionTranslations } from '../features/action-guidance/translations'
import { actionReviewGuidance } from '../features/action-guidance/reviewGuidance'
import type { ActionGuidanceResult, ResponsibleParty, RuleEvaluationStatus } from '../features/action-guidance/types'
import { factStorage } from '../features/fact-confirmation/storage'
import { factTranslations } from '../features/fact-confirmation/translations'
import { demoProfile } from '../types/profile'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
const localeMap: Record<LanguageCode, string> = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN', ne: 'ne-NP' }

export function ActionsPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const [facts] = useState(factStorage.getConfirmed); const content = translations[language]
  const copy = actionTranslations[language]; const factCopy = factTranslations[language]
  const reviewGuidance = actionReviewGuidance[language]
  const [status, setStatus] = useState<RuleEvaluationStatus>('evaluating')
  const [result, setResult] = useState<ActionGuidanceResult | null>(actionStorage.getResult)
  const [filter, setFilter] = useState<'all' | ResponsibleParty>('all')
  const [completed, setCompleted] = useState<string[]>(actionStorage.getCompleted)

  useEffect(() => {
    if (!facts) return
    const controller = new AbortController()
    void (async () => {
      try {
        const response = await apiClient.evaluateActions({ confirmedFacts: confirmedToApi(facts), profile: profileToApi(demoProfile) }, controller.signal)
        const next = actionsFromApi(response, facts); actionStorage.saveApiResult(response); setResult(next); setStatus(next.evaluationStatus); actionStorage.saveResult(next)
      } catch { if (!controller.signal.aborted) setStatus('error') }
    })()
    return () => controller.abort()
  }, [facts])

  const visible = useMemo(() => result?.obligations.filter((item) => filter === 'all' || item.party === filter) ?? [], [result, filter])
  if (!facts) return <Navigate to="/confirm" replace />

  const retry = async () => { setStatus('evaluating'); try { const response = await apiClient.evaluateActions({ confirmedFacts: confirmedToApi(facts), profile: profileToApi(demoProfile) }); const next = actionsFromApi(response, facts); actionStorage.saveApiResult(response); setResult(next); setStatus(next.evaluationStatus); actionStorage.saveResult(next) } catch { setStatus('error') } }
  const toggleComplete = (id: string) => { const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]; setCompleted(next); actionStorage.saveCompleted(next) }
  const summary = [
    [copy.profileLabels.eventType, facts.eventType ? factCopy.values[facts.eventType] : factCopy.notConfirmed],
    [copy.profileLabels.occurredAt, formatDate(facts.occurredAt, localeMap[language]) ?? copy.dateNeeded],
    [copy.profileLabels.visa, demoProfile.visa], [copy.profileLabels.region, content.profile.regionValue],
    [copy.profileLabels.industry, content.profile.industryValue], [copy.profileLabels.wantsChange, facts.wantsWorkplaceChange ? factCopy.values.true : factCopy.values.false],
  ]
  const pageTitle = status === 'evaluating' ? copy.loading : status === 'error' ? copy.errorTitle : status === 'needs_review' ? copy.reviewTitle : copy.title

  return <main className="flow-shell" lang={language}><AppHeader language={language} onLanguageChange={onLanguageChange} /><div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={2} /></div>
    <section className="guidance-layout" aria-live="polite">
      <header className="guidance-heading"><h1>{pageTitle}</h1><p>{status === 'error' ? copy.errorMessage : status === 'needs_review' ? copy.reviewMessage : copy.intro}</p>{status === 'complete' && <p className="demo-rule-notice">{copy.demoWarning}</p>}</header>
      <section className="guidance-summary" aria-labelledby="guidance-summary-title"><h2 id="guidance-summary-title">{copy.summaryTitle}</h2><dl>{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
      {status === 'evaluating' && <StatusSection icon={<LoaderCircle className="loading-icon" />} title={copy.loading} description={copy.intro} />}
      {status === 'error' && <StatusSection icon={<AlertTriangle />} tone="error" title={copy.errorTitle} description={copy.errorMessage} actions={<><button className="next-button" type="button" onClick={() => void retry()}><RefreshCw size={17} aria-hidden="true" />{copy.retry}</button><button className="back-button" type="button" onClick={() => navigate('/confirm')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToFacts}</button></>} />}
      {status === 'needs_review' && <StatusSection icon={<AlertTriangle />} tone="warning" title={copy.reviewTitle} description={copy.reviewMessage} detail={<><p className="review-scenario-guidance">{reviewGuidance.message}</p>{result?.warnings.map((warning) => <p key={warning}>{copy.warnings[warning]}</p>)}</>} actions={<><button className="back-button" type="button" onClick={() => navigate('/confirm')}><ArrowLeft size={17} aria-hidden="true" />{reviewGuidance.editFacts}</button><button className="next-button" type="button" onClick={() => void retry()}><RefreshCw size={17} aria-hidden="true" />{copy.retry}</button></>} />}
      {status === 'complete' && result && <>
        <div className="party-filters" role="group" aria-label={copy.filters.all}>{(['all', 'worker', 'employer', 'institution'] as const).map((key) => <button type="button" className={filter === key ? 'active' : ''} aria-pressed={filter === key} onClick={() => setFilter(key)} key={key}>{copy.filters[key]}</button>)}</div>
        <section className="obligation-list">{visible.length === 0 ? <p className="empty-state">{copy.empty}</p> : visible.map((item) => {
          const evidence = result.evidence.find((entry) => entry.id === item.evidenceId); const done = completed.includes(item.id)
          const reviewRequired = evidence?.verificationStatus === 'review_required'; const evidenceText = evidence ? copy.evidenceText[evidence.id] : undefined
          const showOfficialEvidence = evidence ? canShowOfficialEvidence(evidence.sourceUrl, evidence.verificationStatus) : false
          return <article className={`obligation-card ${reviewRequired ? 'evidence-review' : `urgency-${item.urgency}`}${done ? ' done' : ''}`} key={item.id}><div className="obligation-top"><span className="party-label">{copy.parties[item.party]}</span><span className="urgency-label">{reviewRequired ? copy.reviewDeadlineStatus : <>{copy.urgency[item.urgency]}{item.daysRemaining !== null ? ` · ${copy.daysRemaining(item.daysRemaining)}` : ''}</>}</span></div><h2>{copy.obligationText[item.title]}</h2><p>{copy.obligationText[item.description]}</p><div className="deadline-row"><strong>{reviewRequired ? copy.reviewDeadlineLabel : copy.deadline}</strong><span>{formatDate(reviewRequired ? item.reviewDate : item.deadline, localeMap[language]) ?? copy.dateNeeded}</span></div><div className="document-list"><strong>{copy.documents}</strong>{item.requiredDocuments.length ? <ul>{item.requiredDocuments.map((doc) => <li key={doc.id}><FileText size={14} aria-hidden="true" />{copy.documentText[doc.name]} <small>{copy.documentText[doc.note]}</small></li>)}</ul> : <span>{reviewRequired ? copy.documentsNeedReview : copy.noDocuments}</span>}</div><div className="action-detail"><strong>{copy.questionLabel}</strong><p>{copy.guidanceText[item.question]}</p></div><div className="action-detail"><strong>{copy.rationaleLabel}</strong><p>{copy.guidanceText[item.rationale]}</p></div>
            {evidence && (showOfficialEvidence ? <details className="evidence-details"><summary>{copy.evidence}</summary><dl>{(['issuingAgency', 'sourceTitle', 'checkedAt'] as const).map((key) => <div key={key}><dt>{copy.evidenceLabels[key]}</dt><dd>{key === 'issuingAgency' ? evidenceText?.issuingAgency : key === 'sourceTitle' ? evidenceText?.sourceTitle : evidence.checkedAt}</dd></div>)}</dl><a href={evidence.sourceUrl!} target="_blank" rel="noreferrer">{evidenceText?.sourceTitle}</a></details> : <p className="evidence-pending">{copy.evidencePending}</p>)}
            <label className="completion-check"><input type="checkbox" checked={done} onChange={() => toggleComplete(item.id)} /><span>{copy.complete}</span></label></article>
        })}</section>
        <section className="guidance-warnings"><h2>{copy.warningsTitle}</h2>{result.warnings.map((warning) => <p key={warning}>{copy.warnings[warning]}</p>)}</section>
        <section className="scenario-comparisons"><h2>{copy.comparisonsTitle}</h2><div>{copy.comparisons.map((scenario) => <article key={scenario.title}><h3>{scenario.title}</h3><p>{scenario.change}</p><p>{scenario.check}</p><p>{scenario.unknown}</p></article>)}</div></section>
        <div className="guidance-actions"><button className="back-button" type="button" onClick={() => navigate('/confirm')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToFacts}</button><button className="next-button" type="button" onClick={() => navigate('/handoff')}>{copy.handoff}<ArrowRight size={17} aria-hidden="true" /></button></div>
      </>}
    </section>
  </main>
}
