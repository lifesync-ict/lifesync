import type { HandoffExportSummary } from './summaryFormat'

const safeFilenameDate = (value: string) => value.slice(0, 10).replaceAll('/', '-')

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

function createPdfDocument(data: HandoffExportSummary) {
  const root = element('article')
  Object.assign(root.style, {
    position: 'fixed', left: '-10000px', top: '0', width: '760px', padding: '42px 46px',
    color: '#263e4d', background: '#fffefa', fontFamily: 'Pretendard, "Noto Sans KR", Arial, sans-serif',
    fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em',
  })
  const brand = element('p', 'LifeSync')
  Object.assign(brand.style, { margin: '0 0 10px', color: '#178579', fontSize: '14px', fontWeight: '700', letterSpacing: '0.02em' })
  root.append(brand)
  const title = element('h1', data.title)
  Object.assign(title.style, { margin: '0', color: '#102b42', fontSize: '28px', lineHeight: '1.3', letterSpacing: '-0.035em' })
  root.append(title)
  const generatedAt = element('p', `${data.generatedAtLabel}: ${data.generatedAt}`)
  Object.assign(generatedAt.style, { margin: '8px 0 30px', color: '#65757d', fontSize: '12px' })
  root.append(generatedAt)

  data.sections.forEach((section) => {
    if (!section.entries.length) return
    const sectionNode = element('section')
    Object.assign(sectionNode.style, { margin: '0 0 28px' })
    const heading = element('h2', section.title)
    Object.assign(heading.style, { margin: '0 0 10px', paddingBottom: '8px', color: '#102b42', fontSize: '17px', borderBottom: '2px solid #178579' })
    sectionNode.append(heading)
    section.entries.forEach((entry, index) => {
      const entryNode = element('div')
      Object.assign(entryNode.style, { breakInside: 'avoid', padding: '12px 2px', borderBottom: '1px solid #d9ddd7' })
      const entryTitle = element('h3', `${index + 1}. ${entry.title}`)
      Object.assign(entryTitle.style, { margin: '0', color: '#102b42', fontSize: '14px' })
      entryNode.append(entryTitle)
      if (entry.description) {
        const description = element('p', entry.description)
        Object.assign(description.style, { margin: '4px 0 0', color: '#526a76', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })
        entryNode.append(description)
      }
      entry.fields?.forEach((field) => {
        const detail = element('p')
        Object.assign(detail.style, { margin: '5px 0 0', color: '#526a76', overflowWrap: 'anywhere' })
        if (field.label) {
          const label = element('strong', `${field.label}: `)
          Object.assign(label.style, { color: '#24465b' })
          detail.append(label)
        }
        detail.append(document.createTextNode(field.value))
        entryNode.append(detail)
      })
      sectionNode.append(entryNode)
    })
    root.append(sectionNode)
  })

  if (data.notices.length) {
    const notice = element('aside')
    Object.assign(notice.style, { breakInside: 'avoid', padding: '14px 16px', color: '#725d27', background: '#f4efd9', borderLeft: '3px solid #a88736' })
    const noticeTitle = element('strong', data.noticesTitle)
    notice.append(noticeTitle)
    data.notices.forEach((text) => {
      const paragraph = element('p', text)
      Object.assign(paragraph.style, { margin: '4px 0' })
      notice.append(paragraph)
    })
    root.append(notice)
  }
  return root
}

export async function downloadPdf(data: HandoffExportSummary) {
  const { default: html2pdf } = await import('html2pdf.js')
  const root = createPdfDocument(data)
  document.body.append(root)
  try {
    await document.fonts?.ready
    const options = {
      margin: [12, 12, 16, 12],
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fffefa' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['section > div', 'aside'] },
    }
    const worker = new html2pdf.Worker().set(options as never).from(root).toPdf()
    const pdf = await worker.get('pdf')
    const pageCount = pdf.internal.getNumberOfPages()
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page)
      pdf.setFontSize(9)
      pdf.setTextColor(101, 117, 125)
      pdf.text(`${page} / ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 6, { align: 'center' })
    }
    const blob = await worker.outputPdf('blob') as Blob
    if (blob.type !== 'application/pdf' || blob.size < 1_000 || await blob.slice(0, 5).text() !== '%PDF-') throw new Error('invalid_pdf_output')
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lifesync-handoff-summary-${safeFilenameDate(data.filenameDate)}.pdf`
    anchor.hidden = true
    document.body.append(anchor)
    anchor.click()
    window.setTimeout(() => { anchor.remove(); URL.revokeObjectURL(url) }, 60_000)
  } finally {
    root.remove()
  }
}
