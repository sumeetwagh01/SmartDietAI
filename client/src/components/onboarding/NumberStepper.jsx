import { Minus, Plus } from 'lucide-react'

export default function NumberStepper({ label, value, min, max, onChange }) {
  const set = (next) => onChange(Math.min(max, Math.max(min, Number(next) || min)))
  return <div><span className="mb-2 block text-sm font-medium">{label}</span><div className="flex items-center justify-between rounded-2xl border border-line bg-surface-2 p-1"><button type="button" onClick={() => set(Number(value) - 1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-surface" aria-label={`Decrease ${label}`}><Minus size={18} /></button><input aria-label={label} type="number" min={min} max={max} value={value} onChange={(event) => set(event.target.value)} className="w-24 bg-transparent text-center text-xl font-bold outline-none" /><button type="button" onClick={() => set(Number(value) + 1)} className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-surface" aria-label={`Increase ${label}`}><Plus size={18} /></button></div></div>
}
