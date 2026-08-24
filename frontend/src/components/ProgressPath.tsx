import { Building2, ClipboardCheck, FilePenLine, ListChecks } from 'lucide-react'

type Props = { steps: readonly string[]; label: string; currentStep?: number }
const icons = [FilePenLine, ClipboardCheck, ListChecks, Building2]

export function ProgressPath({ steps, label, currentStep = 0 }: Props) {
  return <div className="progress-area">
    <div className="progress-heading"><span>{label}</span><span aria-label={`${currentStep + 1} of 4`}>{String(currentStep + 1).padStart(2, '0')} / 04</span></div>
    <ol className="progress-path" aria-label={label}>
      {steps.map((step, index) => {
        const Icon = icons[index]
        return <li className={`progress-step${index === currentStep ? ' current' : ''}${index < currentStep ? ' complete' : ''}`} key={step} aria-current={index === currentStep ? 'step' : undefined}>
          <span className="progress-icon"><Icon size={12} strokeWidth={1.8} aria-hidden="true" /></span><span>{step}</span>
        </li>
      })}
    </ol>
  </div>
}
