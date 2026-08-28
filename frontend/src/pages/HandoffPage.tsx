import { AlertTriangle, ArrowLeft, Check, ClipboardCopy, Download, LoaderCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { StatusSection } from '../components/StatusSection'
import { translations, type LanguageCode } from '../data/translations'
import { apiClient } from '../api/client'
import { confirmedToApi, handoffFromApi, profileToApi } from '../api/adapters'
import { shouldShowSharedHandoffNotice } from '../api/guidancePolicy'
import { actionStorage } from '../features/action-guidance/storage'
import { actionTranslations } from '../features/action-guidance/translations'
import { downloadPdf } from '../features/institution-handoff/bundleUtils'
import { summaryText, type HandoffExportSummary, type SummaryEntry } from '../features/institution-handoff/summaryFormat'
import { clearLifeSyncSession, handoffStorage } from '../features/institution-handoff/storage'
import { handoffTranslations } from '../features/institution-handoff/translations'
import type { HandoffResult, HandoffStatus } from '../features/institution-handoff/types'
import { factStorage } from '../features/fact-confirmation/storage'
import { factTranslations } from '../features/fact-confirmation/translations'
import { formatFactValue } from '../features/fact-confirmation/formatters'
import { demoProfile } from '../types/profile'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function HandoffPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const [facts] = useState(factStorage.getConfirmed); const [actions] = useState(actionStorage.getResult)
  const [apiActions] = useState(actionStorage.getApiResult)
  const [status, setStatus] = useState<HandoffStatus>('preparing'); const [result, setResult] = useState<HandoffResult | null>(handoffStorage.getResult)
  const [included, setIncluded] = useState<Record<string, boolean>>(handoffStorage.getIncluded); const [message, setMessage] = useState(''); const [dialogOpen, setDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null); const content = translations[language]; const copy = handoffTranslations[language]; const actionCopy = actionTranslations[language]
  const factCopy = factTranslations[language]

  useEffect(() => {
    if (!facts || !actions?.obligations.length || !apiActions) return
    const controller = new AbortController()
    const saved = handoffStorage.getIncluded()
    void (async () => {
      try {
        const response = await apiClient.prepareHandoff({ confirmedFacts: confirmedToApi(facts), profile: profileToApi(demoProfile), actionGuidance: apiActions, completedActionIds: actionStorage.getCompleted(), selectedEvidenceItemIds: Object.entries(saved).filter(([, selected]) => selected).map(([id]) => id) }, controller.signal)
        const next = handoffFromApi(response, facts, actions, actionStorage.getCompleted(), demoProfile)
        setResult(next); setStatus(next.status); handoffStorage.saveResult(next); const defaults = Object.fromEntries(next.evidenceBundle.map((item) => [item.id, saved[item.id] ?? item.included])); setIncluded(defaults); handoffStorage.saveIncluded(defaults)
      } catch { if (!controller.signal.aborted) setStatus('error') }
    })()
    return () => controller.abort()
  }, [facts, actions, apiActions])

  useEffect(() => { if (!dialogOpen) return; dialogRef.current?.focus(); const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setDialogOpen(false) }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close) }, [dialogOpen])

  if (!facts) return <Navigate to="/confirm" replace />
  if (!actions?.obligations.length || !apiActions) return <Navigate to="/actions" replace />

  const retry = async () => { setStatus('preparing'); try { const response = await apiClient.prepareHandoff({ confirmedFacts: confirmedToApi(facts), profile: profileToApi(demoProfile), actionGuidance: apiActions, completedActionIds: actionStorage.getCompleted(), selectedEvidenceItemIds: Object.entries(included).filter(([, selected]) => selected).map(([id]) => id) }); const next = handoffFromApi(response, facts, actions, actionStorage.getCompleted(), demoProfile); setResult(next); setStatus(next.status); handoffStorage.saveResult(next) } catch { setStatus('error') } }
  const toggle = (id: string) => { const next = { ...included, [id]: !(included[id] ?? true) }; setIncluded(next); handoffStorage.saveIncluded(next) }
  const itemTitle = (key: string) => copy.items[key] ?? actionCopy.obligationText[key] ?? actionCopy.documentText[key] ?? copy.questions[key] ?? key
  const itemDescription = (key: string) => copy.items[key] ?? actionCopy.obligationText[key] ?? actionCopy.documentText[key] ?? copy.questions[key] ?? copy.items.unverifiedDescription
  const itemDisplayDescription = (item: HandoffResult['evidenceBundle'][number]) => {
    if (item.id === 'source-text') return facts.sourceText
    if (item.id === 'confirmed-facts') return [facts.eventType ? factCopy.values[facts.eventType] : factCopy.notConfirmed, facts.occurredAt ?? factCopy.notConfirmed, formatFactValue('actor', facts.actor, factCopy), formatFactValue('documentsProvided', facts.documentsProvided, factCopy), formatFactValue('wantsWorkplaceChange', facts.wantsWorkplaceChange, factCopy)].join(' · ')
    if (item.id === 'demo-profile') return [demoProfile.visa, content.profile.regionValue, content.profile.industryValue].join(' · ')
    return item.literal ?? itemDescription(item.description)
  }
  const exportData = (): HandoffExportSummary | null => {
    if (!result) return null
    const now = new Date()
    const institutionEntry = (institution: NonNullable<HandoffResult['primaryInstitution']>): SummaryEntry => ({
      title: copy.institutions[institution.type],
      fields: [
        { label: copy.role, value: copy.roles[institution.role] },
        { label: copy.reason, value: copy.reasons[institution.reason] },
        { label: copy.questionLabel ?? copy.reason, value: copy.institutionQuestions?.[institution.type] ?? copy.questions.questionJurisdiction },
        ...(institution.jurisdiction ? [{ label: copy.jurisdiction, value: institution.jurisdiction }] : []),
        ...(institution.address ? [{ value: institution.address }] : []),
        ...(institution.phone ? [{ value: institution.phone }] : []),
        ...(institution.sourceUrl ? [{ value: institution.sourceUrl }] : []),
      ],
    })
    return {
      title: copy.bundleTitle,
      generatedAtLabel: copy.generatedAtLabel,
      generatedAt: new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(now),
      filenameDate: now.toISOString().slice(0, 10),
      sections: [
        { title: copy.bundleTitle, entries: result.evidenceBundle.filter((item) => included[item.id] ?? item.included).map((item) => ({ title: itemTitle(item.title), description: itemDisplayDescription(item) })) },
        { title: copy.primary, entries: result.primaryInstitution ? [institutionEntry(result.primaryInstitution)] : [] },
        { title: copy.alternatives, entries: result.alternativeInstitutions.map(institutionEntry) },
      ],
      noticesTitle: copy.warningTitle,
      notices: [copy.privacyNotice, copy.jurisdictionNotice ?? copy.reviewMessage],
    }
  }
  const copySummary = async () => { try { const data = exportData(); if (!data) return; await navigator.clipboard.writeText(summaryText(data)); setMessage(copy.copySuccess) } catch { setMessage(copy.copyError) } }
  const saveSummary = async () => { try { const data = exportData(); if (!data) throw new Error(); await downloadPdf(data); setMessage(copy.downloadSuccess) } catch { setMessage(copy.downloadError) } }
  const restart = () => { clearLifeSyncSession(); setDialogOpen(false); navigate('/situation') }
  const institutionCard = (institution: NonNullable<HandoffResult['primaryInstitution']>) => <article className="institution-card" key={institution.id}><h3>{copy.institutions[institution.type]}</h3><dl><div><dt>{copy.role}</dt><dd>{copy.roles[institution.role]}</dd></div><div><dt>{copy.reason}</dt><dd>{copy.reasons[institution.reason]}</dd></div><div><dt>{copy.questionLabel ?? copy.reason}</dt><dd>{copy.institutionQuestions?.[institution.type] ?? copy.questions.questionJurisdiction}</dd></div>{institution.jurisdiction && <div><dt>{copy.jurisdiction}</dt><dd>{institution.jurisdiction}</dd></div>}</dl>{institution.address && <address>{institution.address}</address>}{institution.phone && <a href={`tel:${institution.phone}`}>{institution.phone}</a>}{institution.sourceUrl && <a href={institution.sourceUrl} target="_blank" rel="noreferrer">{institution.sourceUrl}</a>}</article>
  const pageTitle = status === 'preparing' ? copy.loading : status === 'error' ? copy.errorTitle : status === 'needs_review' ? copy.reviewTitle : copy.title

  return <main className="flow-shell" lang={language}><AppHeader language={language} onLanguageChange={onLanguageChange} /><div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={3} /></div><section className="handoff-layout" aria-live="polite">
    <header className="handoff-heading"><h1>{pageTitle}</h1><p>{status === 'error' ? copy.errorMessage : copy.intro}</p>{shouldShowSharedHandoffNotice(status) && <p className="demo-rule-notice">{copy.jurisdictionNotice ?? copy.reviewMessage}</p>}</header>
    {status === 'preparing' && <><StatusSection icon={<LoaderCircle className="loading-icon" />} title={copy.loading} description={copy.intro} />{result?.primaryInstitution && <section className="retained-context"><h2>{copy.primary}</h2>{institutionCard(result.primaryInstitution)}</section>}</>}
    {status === 'error' && <><StatusSection icon={<AlertTriangle />} tone="error" title={copy.errorTitle} description={copy.errorMessage} actions={<><button className="next-button" type="button" onClick={() => void retry()}><RefreshCw size={17} aria-hidden="true" />{copy.retry}</button><button className="back-button" type="button" onClick={() => navigate('/actions')}><ArrowLeft size={17} aria-hidden="true" />{copy.actions}</button></>} />{result?.primaryInstitution && <section className="retained-context"><h2>{copy.primary}</h2>{institutionCard(result.primaryInstitution)}</section>}</>}
    {(status === 'ready' || status === 'needs_review') && result && <>
      <section className="institution-section"><h2>{copy.primary}</h2>{result.primaryInstitution ? institutionCard(result.primaryInstitution) : <p>{copy.infoPending}</p>}<h2>{copy.alternatives}</h2><div className="institution-grid">{result.alternativeInstitutions.map(institutionCard)}</div></section>
      <section className="bundle-section"><h2>{copy.bundleTitle}</h2><p>{copy.bundleDescription}</p><div className="bundle-list">{result.evidenceBundle.map((item) => <label key={item.id}><input type="checkbox" checked={included[item.id] ?? item.included} onChange={() => toggle(item.id)} /><span><strong>{itemTitle(item.title)}</strong><small>{itemDisplayDescription(item)}</small></span><em>{copy.include}</em></label>)}</div><p className="privacy-note">{copy.privacyNotice}</p><div className="bundle-actions"><button className="back-button" type="button" onClick={() => void copySummary()}><ClipboardCopy size={17} aria-hidden="true" />{copy.copy}</button><button className="next-button" type="button" onClick={() => void saveSummary()}><Download size={17} aria-hidden="true" />{copy.download}</button></div><p className="handoff-message" aria-live="polite">{message}</p></section>
      {result.warnings.length > 0 && <section className="handoff-warnings"><h2>{copy.warningTitle}</h2>{result.warnings.map((warning) => <p key={warning}>{copy.warnings[warning]}</p>)}</section>}
      <div className="handoff-nav"><button className="back-button" type="button" onClick={() => navigate('/confirm')}><ArrowLeft size={17} aria-hidden="true" />{copy.edit}</button><button className="back-button" type="button" onClick={() => navigate('/actions')}>{copy.actions}</button><button className="restart-button" type="button" onClick={() => setDialogOpen(true)}><RotateCcw size={17} aria-hidden="true" />{copy.restart}</button></div>
    </>}
  </section>
  {dialogOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false) }}><div className="restart-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-title" tabIndex={-1} ref={dialogRef}><h2 id="restart-title">{copy.restartTitle}</h2><p>{copy.restartMessage}</p><div><button className="back-button" type="button" onClick={() => setDialogOpen(false)}>{copy.cancel}</button><button className="danger-button" type="button" onClick={restart}><Check size={17} aria-hidden="true" />{copy.confirmRestart}</button></div></div></div>}
  </main>
}
