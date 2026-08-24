import { ArrowLeft, Building2 } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { translations, type LanguageCode } from '../data/translations'
import { actionStorage } from '../features/action-guidance/storage'
import { actionTranslations } from '../features/action-guidance/translations'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function HandoffPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const result = actionStorage.getResult(); const content = translations[language]; const copy = actionTranslations[language]
  if (!result?.obligations.length) return <Navigate to="/actions" replace />
  return <main className="flow-shell" lang={language}><AppHeader language={language} onLanguageChange={onLanguageChange} /><div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={3} /></div><section className="handoff-panel"><Building2 aria-hidden="true" /><p className="step-kicker">04 / 04 · {content.progress[3]}</p><h1>{copy.handoffTitle}</h1><p>{copy.handoffDescription}</p><p className="demo-rule-notice">{copy.handoffNotice}</p><button className="back-button" type="button" onClick={() => navigate('/actions')}><ArrowLeft size={17} aria-hidden="true" />{copy.backToActions}</button></section></main>
}
