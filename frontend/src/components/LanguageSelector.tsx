import { ChevronDown, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { languageCodes, translations, type LanguageCode } from '../data/translations'

type Props = { value: LanguageCode; onChange: (language: LanguageCode) => void }

export function LanguageSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  return (
    <div className="language-selector" ref={containerRef}>
      <button type="button" className="language-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Languages size={16} aria-hidden="true" />
        <span>{translations[value].languageName}</span>
        <ChevronDown className={`chevron${open ? ' open' : ''}`} size={14} aria-hidden="true" />
      </button>
      {open && <ul className="language-menu" role="listbox" aria-label="Select language">
        {languageCodes.map((code) => <li key={code} role="option" aria-selected={code === value}>
          <button type="button" className={`language-option${code === value ? ' selected' : ''}`} onClick={() => { onChange(code); setOpen(false) }}>{translations[code].languageName}</button>
        </li>)}
      </ul>}
    </div>
  )
}
