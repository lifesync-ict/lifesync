import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import heroImage from '../assets/lifesync-hero-v2.png'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { translations, type LanguageCode } from '../data/translations'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function LandingPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const content = translations[language]
  return <main className="landing-shell" style={{ backgroundImage: `url(${heroImage})` }}>
    <AppHeader language={language} onLanguageChange={onLanguageChange} />
    <section className="hero-section" id="main-content" lang={language}>
      <div className="hero-copy"><p className="eyebrow">KOREA PATH · ADMINISTRATIVE NAVIGATION</p><h1>{content.landing.title}</h1><p className="description">{content.landing.description}</p>
        <button className="start-button" type="button" onClick={() => navigate('/situation')}><span>{content.landing.button}</span><ArrowRight size={19} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <ProgressPath steps={content.progress} label={content.progressLabel} currentStep={0} />
    </section>
  </main>
}
