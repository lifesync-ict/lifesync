import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { translations, type LanguageCode } from '../data/translations'
import { factStorage } from '../features/fact-confirmation/storage'
import { formatFactValue } from '../features/fact-confirmation/formatters'
import { factTranslations } from '../features/fact-confirmation/translations'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function ActionsPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const facts = factStorage.getConfirmed(); const content = translations[language]; const copy = factTranslations[language]
  if (!facts) return <Navigate to="/confirm" replace />
  const rows = [
    [copy.facts.eventType, facts.eventType ? copy.values[facts.eventType] : copy.notConfirmed],
    [copy.facts.occurredAt, facts.occurredAt ?? copy.notConfirmed],
    [copy.facts.documentsProvided, formatFactValue('documentsProvided', facts.documentsProvided, copy)],
    [copy.facts.wantsWorkplaceChange, facts.wantsWorkplaceChange === null ? copy.notConfirmed : copy.values[String(facts.wantsWorkplaceChange)]],
  ]
  return <main className="flow-shell" lang={language}><AppHeader language={language} onLanguageChange={onLanguageChange} /><div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={2} /></div><section className="actions-panel"><ClipboardList aria-hidden="true" /><p className="step-kicker">03 / 04 · {content.progress[2]}</p><h1>{copy.actionsTitle}</h1><p>{copy.actionsDescription}</p><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="actions-notice">{copy.actionsNotice}</p><button className="back-button" type="button" onClick={() => navigate('/confirm')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToConfirm}</button></section></main>
}
