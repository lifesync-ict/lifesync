export type SummaryField = { label?: string; value: string }
export type SummaryEntry = { title: string; description?: string; fields?: SummaryField[] }
export type SummarySection = { title: string; entries: SummaryEntry[] }
export type HandoffExportSummary = {
  title: string
  generatedAtLabel: string
  generatedAt: string
  filenameDate: string
  sections: SummarySection[]
  noticesTitle: string
  notices: string[]
}

export function summaryText(data: HandoffExportSummary) {
  const lines = [data.title, `${data.generatedAtLabel}: ${data.generatedAt}`]
  data.sections.forEach((section) => {
    if (!section.entries.length) return
    lines.push('', section.title)
    section.entries.forEach((entry) => {
      lines.push(`- ${entry.title}`)
      if (entry.description) lines.push(`  ${entry.description}`)
      entry.fields?.forEach((field) => lines.push(`  ${field.label ? `${field.label}: ` : ''}${field.value}`))
    })
  })
  if (data.notices.length) {
    lines.push('', data.noticesTitle)
    data.notices.forEach((notice) => lines.push(`- ${notice}`))
  }
  return lines.join('\n')
}
