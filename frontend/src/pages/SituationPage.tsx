import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ProgressPath } from '../components/ProgressPath'
import { translations, type LanguageCode } from '../data/translations'
import { demoProfile } from '../types/profile'
import { prepareSourceSession } from '../features/sessionLifecycle'

export const SITUATION_KEY = 'lifesync-situation'
const MAX_LENGTH = 1000
type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }

export function SituationPage({ language, onLanguageChange }: Props) {
  const navigate = useNavigate(); const content = translations[language]
  const [value, setValue] = useState(() => sessionStorage.getItem(SITUATION_KEY) ?? '')
  const [touched, setTouched] = useState(false); const isValid = value.trim().length > 0
  const updateValue = (next: string) => { setValue(next); sessionStorage.setItem(SITUATION_KEY, next) }
  const submit = () => { setTouched(true); if (!isValid) return; const source = prepareSourceSession(value); sessionStorage.setItem(SITUATION_KEY, source); setValue(source); navigate('/confirm') }
  const profileValues = [demoProfile.visa, content.profile.nationalityValue, content.profile.regionValue, content.profile.industryValue, content.profile.workplaceValue]
  const profileLabels = [content.profile.visa, content.profile.nationality, content.profile.region, content.profile.industry, content.profile.workplace]

  return <main className="flow-shell" lang={language}>
    <AppHeader language={language} onLanguageChange={onLanguageChange} />
    <div className="flow-progress"><ProgressPath steps={content.progress} label={content.progressLabel} currentStep={0} /></div>
    <section className="situation-layout">
      <div className="situation-intro"><h1>{content.situation.title}</h1><p>{content.situation.description}</p></div>
      <div className="demo-profile" aria-label={content.profile.demoLabel}><span className="demo-label"><Info size={14} aria-hidden="true" />{content.profile.demoLabel}</span><dl>{profileLabels.map((label, index) => <div key={label}><dt>{label}</dt><dd>{profileValues[index]}</dd></div>)}</dl></div>
      <form className="situation-form" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <label htmlFor="situation-input">{content.situation.inputLabel}</label>
        <div className="textarea-wrap"><textarea id="situation-input" value={value} maxLength={MAX_LENGTH} placeholder={content.situation.placeholder} onBlur={() => setTouched(true)} onChange={(event) => updateValue(event.target.value)} aria-describedby="privacy-note character-count input-error" aria-invalid={touched && !isValid} /><span className="character-count" id="character-count">{content.situation.characterCount(value.length, MAX_LENGTH)}</span></div>
        <p className="privacy-note" id="privacy-note"><Info size={15} aria-hidden="true" />{content.situation.privacy}</p>
        <p className="input-error" id="input-error" aria-live="polite">{touched && !isValid ? content.situation.error : ''}</p>
        <fieldset className="examples"><legend>{content.situation.examplesLabel}</legend><div>{content.situation.examples.map((example) => <button type="button" key={example} onClick={() => { updateValue(example); setTouched(false) }}>{example}</button>)}</div></fieldset>
        <div className="form-actions"><button className="back-button" type="button" onClick={() => navigate('/')}><ArrowLeft size={17} aria-hidden="true" />{content.situation.back}</button><button className="next-button" type="submit" disabled={!isValid}>{content.situation.next}<ArrowRight size={17} aria-hidden="true" /></button></div>
      </form>
    </section>
  </main>
}
