import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import './App.css'
import heroImage from './assets/lifesync-hero-v2.png'
import { BrandWordmark } from './components/BrandWordmark'
import { LanguageSelector } from './components/LanguageSelector'
import { ProgressPath } from './components/ProgressPath'
import { translations, type LanguageCode } from './data/translations'

function App() {
  const [language, setLanguage] = useState<LanguageCode>('ko')
  const content = translations[language]

  return (
    <main className="landing-shell" style={{ backgroundImage: `url(${heroImage})` }}>
      <header className="site-header">
        <BrandWordmark />
        <LanguageSelector value={language} onChange={setLanguage} />
      </header>

      <section className="hero-section" id="main-content" lang={language}>
        <div className="hero-copy">
          <p className="eyebrow">KOREA PATH · ADMINISTRATIVE NAVIGATION</p>
          <h1>{content.title}</h1>
          <p className="description">{content.description}</p>
          <button className="start-button" type="button" onClick={() => console.log('start')}>
            <span>{content.button}</span>
            <ArrowRight size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <ProgressPath steps={content.progress} label={content.progressLabel} />
      </section>
    </main>
  )
}

export default App
