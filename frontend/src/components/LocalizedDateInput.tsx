import { useMemo, useState } from 'react'
import { datePartsToIso, daysInMonth, parseIsoDate, type DatePart, type DateParts } from '../features/fact-confirmation/dateInput'

type Props = {
  value: string
  labels: Record<DatePart, string>
  order: DatePart[]
  onChange: (value: string) => void
}

const currentYear = new Date().getFullYear()

export function LocalizedDateInput({ value, labels, order, onChange }: Props) {
  const [parts, setParts] = useState<DateParts>(() => parseIsoDate(value))
  const years = useMemo(() => Array.from({ length: 101 }, (_, index) => String(currentYear - index)), [])

  const update = (part: DatePart, nextValue: string) => {
    const next = { ...parts, [part]: nextValue }
    if (Number(next.day) > daysInMonth(next.year, next.month)) next.day = ''
    setParts(next)
    onChange(datePartsToIso(next))
  }

  const options: Record<DatePart, string[]> = {
    year: years,
    month: Array.from({ length: 12 }, (_, index) => String(index + 1)),
    day: Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, index) => String(index + 1)),
  }

  return <div className="localized-date-input">
    {order.map((part) => <select key={part} value={parts[part]} aria-label={labels[part]} required onChange={(event) => update(part, event.target.value)}>
      <option value="">{labels[part]}</option>
      {options[part].map((option) => <option value={option} key={option}>{option}</option>)}
    </select>)}
  </div>
}
