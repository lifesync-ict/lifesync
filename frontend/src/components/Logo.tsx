import { Link } from 'react-router-dom'
import type { LanguageCode } from '../data/translations'

type Props = { language: LanguageCode }

const homeLabels: Record<LanguageCode, string> = {
  ko: 'LifeSync 시작 화면으로 이동',
  en: 'Go to the LifeSync start page',
  vi: 'Đi đến trang bắt đầu LifeSync',
  ne: 'LifeSync सुरु पृष्ठमा जानुहोस्',
}

export function Logo({ language }: Props) {
  return <Link className="logo" to="/" aria-label={homeLabels[language]}>
    <span className="logo-wordmark" aria-hidden="true">
      <span className="logo-life">Life</span><span className="logo-s">S</span><span className="logo-ync">ync</span>
    </span>
  </Link>
}
