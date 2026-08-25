import type { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  badge?: string
  tone?: 'neutral' | 'warning' | 'error'
  title: string
  description?: string
  detail?: ReactNode
  actions?: ReactNode
}

export function StatusSection({ icon, badge, tone = 'neutral', title, description, detail, actions }: Props) {
  return <section className={`status-section status-${tone}`} aria-live="polite">
    <div className="status-section-icon" aria-hidden="true">{icon}</div>
    <div className="status-section-body">
      {badge && <p className="status-section-badge">{badge}</p>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {detail && <div className="status-section-detail">{detail}</div>}
      {actions && <div className="status-section-actions">{actions}</div>}
    </div>
  </section>
}
