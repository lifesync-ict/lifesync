import type { LanguageCode } from '../data/translations'
import { Logo } from './Logo'
import { LanguageSelector } from './LanguageSelector'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function AppHeader({ language, onLanguageChange }: Props) {
  return <header className="site-header"><Logo language={language} /><LanguageSelector value={language} onChange={onLanguageChange} /></header>
}
