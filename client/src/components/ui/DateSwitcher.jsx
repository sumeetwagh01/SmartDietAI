import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { formatShortDate, shiftDate, toIsoDate } from '@/utils/dates'

export default function DateSwitcher({ value, onChange, allowedDates }) {
  const today = toIsoDate(new Date())
  const label = value === today ? 'Today' : formatShortDate(value)
  const dates = allowedDates ? [...new Set(allowedDates)].sort() : null
  const index = dates?.indexOf(value) ?? -1
  const previous = dates ? dates[index - 1] : shiftDate(value, -1)
  const next = dates ? dates[index + 1] : shiftDate(value, 1)
  return <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1"><button type="button" disabled={!previous} className="grid min-h-10 min-w-10 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-30" onClick={() => previous && onChange(previous)} aria-label="Previous available day"><ChevronLeft size={18} /></button><label className="relative flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold"><CalendarDays size={16} className="text-accent" /><span>{label}</span>{dates ? <select value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Choose plan date">{dates.map((date) => <option key={date} value={date}>{date === today ? 'Today' : formatShortDate(date)}</option>)}</select> : <input type="date" value={value} max={today} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Choose date" />}</label><button type="button" disabled={!next || (!dates && value >= today)} className="grid min-h-10 min-w-10 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-30" onClick={() => next && onChange(next)} aria-label="Next available day"><ChevronRight size={18} /></button></div>
}
