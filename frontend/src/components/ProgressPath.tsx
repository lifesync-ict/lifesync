type Props = { steps: readonly string[]; label: string; currentStep?: number }

export function ProgressPath({ steps, label, currentStep = 0 }: Props) {
  return <nav className="progress-area" aria-label={label} style={{ '--progress': `${((currentStep + 1) / steps.length) * 100}%` } as CSSProperties}>
    <ol className="progress-path" aria-label={label}>
      {steps.map((step, index) => <li className={`progress-step${index === currentStep ? ' current' : ''}${index < currentStep ? ' complete' : ''}`} key={step} aria-current={index === currentStep ? 'step' : undefined}><span className="progress-mark" aria-hidden="true">{index < currentStep ? '✓' : ''}</span><span>{step}</span></li>)}
    </ol>
    <span className="mobile-progress-label">{steps[currentStep]}</span><span className="mobile-progress-track" aria-hidden="true"><span /></span>
  </nav>
}
import type { CSSProperties } from 'react'
