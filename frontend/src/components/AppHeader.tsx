import type { LanguageCode } from '../data/translations'
import { BrandWordmark } from './BrandWordmark'
import { LanguageSelector } from './LanguageSelector'

type Props = { language: LanguageCode; onLanguageChange: (language: LanguageCode) => void }
export function AppHeader({ language, onLanguageChange }: Props) {
  return <header className="site-header"><BrandWordmark /><LanguageSelector value={language} onChange={onLanguageChange} /></header>
}
