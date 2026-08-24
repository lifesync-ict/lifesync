import { ArrowLeft, Check } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { translations, type LanguageCode } from '../data/translations'
import { SITUATION_KEY } from './SituationPage'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function ConfirmPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const savedSituation = sessionStorage.getItem(SITUATION_KEY)?.trim()
  if (!savedSituation) return <Navigate to="/situation" replace />
  const content = translations[language]
  return <main className="flow-shell" lang={language}><AppHeader language={language} onLanguageChange={onLanguageChange} /><div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={1} /></div>
    <section className="confirm-panel"><span className="confirm-icon" aria-hidden="true"><Check size={24} /></span><p className="step-kicker">02 / 04 · {content.progress[1]}</p><h1>{content.confirm.title}</h1><p className="confirm-description">{content.confirm.description}</p><blockquote>{savedSituation}</blockquote><p className="temporary-note">{content.confirm.temporary}</p><button className="back-button" type="button" onClick={() => navigate('/situation')}><ArrowLeft size={17} aria-hidden="true" />{content.confirm.back}</button></section>
  </main>
}
