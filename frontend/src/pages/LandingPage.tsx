import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import heroImage from '../assets/lifesync-hero-ribbon.png'
import { AppHeader } from '../components/AppHeader'
import { translations, type LanguageCode } from '../data/translations'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function LandingPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const content = translations[language]
  return <main className="landing-shell" style={{ backgroundImage: `url(${heroImage})` }}>
    <AppHeader language={language} onLanguageChange={onLanguageChange} />
    <section className="hero-section" id="main-content" lang={language}>
      <div className="hero-copy"><h1 className="hero-title">LifeSync</h1><p className="hero-tagline">{content.landing.tagline}</p>
        <button className="start-button" type="button" onClick={() => navigate('/situation')}><span>{content.landing.button}</span><ArrowRight size={19} strokeWidth={1.8} aria-hidden="true" /></button>
        <p className="landing-trust">{content.landing.trust}</p>
      </div>
    </section>
  </main>
}
