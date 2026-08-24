import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { translations, type LanguageCode } from './data/translations'
import { ConfirmPage } from './pages/ConfirmPage'
import { ActionsPage } from './pages/ActionsPage'
import { LandingPage } from './pages/LandingPage'
import { SituationPage } from './pages/SituationPage'

const LANGUAGE_KEY = 'lifesync-language'

function getInitialLanguage(): LanguageCode {
  const saved = localStorage.getItem(LANGUAGE_KEY)
  return saved && saved in translations ? saved as LanguageCode : 'ko'
}

function App() {
  const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage)
  useEffect(() => { localStorage.setItem(LANGUAGE_KEY, language); document.documentElement.lang = language }, [language])

  return <BrowserRouter><Routes>
    <Route path="/" element={<LandingPage language={language} onLanguageChange={setLanguage} />} />
    <Route path="/situation" element={<SituationPage language={language} onLanguageChange={setLanguage} />} />
    <Route path="/confirm" element={<ConfirmPage language={language} onLanguageChange={setLanguage} />} />
    <Route path="/actions" element={<ActionsPage language={language} onLanguageChange={setLanguage} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}

export default App
