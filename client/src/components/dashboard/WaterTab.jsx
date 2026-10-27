import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import usePrefsStore from '@/store/prefsStore'
import useAuthStore from '@/store/authStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { lastDates } from '@/utils/dates'

export default function WaterTab({ date }) {
  const profileWeight = useAuthStore((state) => Number(state.user?.weight_kg) || 60)
  const { waterGoalMl, setRoutine } = usePrefsStore()
  const { waterByDate, waterActionsByDate, addWater, undoWater } = useWellnessStore()
  const showToast = useToastStore((state) => state.show)
  const [custom, setCustom] = useState('')
  const goal = waterGoalMl || Math.round((35 * profileWeight) / 50) * 50
  const consumed = waterByDate[date] || 0
  const percent = Math.min(100, Math.round((consumed / goal) * 100))
  const dates = useMemo(() => lastDates(date), [date])
  const stats = useMemo(() => {
    const values = dates.map((day) => waterByDate[day] || 0)
    let streak = 0
    for (let index = values.length - 1; index >= 0 && values[index] >= goal; index -= 1) streak += 1
    return { streak, average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) }
  }, [dates, goal, waterByDate])
  const add = (amount) => { if (amount > 0) { addWater(date, amount); showToast(`Added ${amount} ml water.`) } }

  return <div className="grid gap-5 lg:grid-cols-2"><Card className="flex flex-col items-center"><div className="flex w-full items-start justify-between"><div><h2 className="text-xl font-bold">Hydration</h2><p className="text-sm text-muted">{percent}% completed</p></div><label className="text-right text-xs text-muted">Daily goal<input aria-label="Daily water goal" type="number" min="500" step="50" value={goal} onChange={(event) => setRoutine({ waterGoalMl: Math.max(500, Number(event.target.value) || 500) })} className="mt-1 block min-h-11 w-28 rounded-xl border border-line bg-surface-2 px-3 text-right text-sm font-semibold text-ink" /></label></div><div className="relative mt-5 h-64 w-36 overflow-hidden rounded-[42px] border-4 border-water/50 bg-surface-2"><motion.div className="absolute inset-x-0 bottom-0 bg-water/80" animate={{ height: `${percent}%` }} transition={{ type: 'spring', damping: 24 }}><div className="absolute -top-2 h-4 w-full rounded-[50%] bg-water" /></motion.div><div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-bold">{consumed}</p><p className="text-xs text-muted">of {goal} ml</p></div></div></div><div className="mt-6 flex flex-wrap justify-center gap-2">{[250, 330, 500].map((amount) => <button key={amount} type="button" onClick={() => add(amount)} className="min-h-11 rounded-full bg-water/15 px-4 text-sm font-semibold text-water">+ {amount} ml</button>)}</div><div className="mt-3 flex w-full max-w-sm gap-2"><label className="sr-only" htmlFor="custom-water">Custom water amount</label><input id="custom-water" type="number" min="1" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Custom ml" className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 text-sm" /><Button variant="secondary" onClick={() => { add(Number(custom)); setCustom('') }} disabled={!Number(custom)}>Add</Button></div><button type="button" disabled={!waterActionsByDate[date]?.length} onClick={() => undoWater(date)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-muted disabled:opacity-40"><RotateCcw size={16} />Undo last</button></Card><div className="space-y-5"><Card><h2 className="font-semibold">This week</h2><div className="mt-5 grid grid-cols-7 gap-2">{dates.map((day) => { const value = waterByDate[day] || 0; const fill = Math.min(100, (value / goal) * 100); return <div key={day} className="text-center"><div className="relative mx-auto h-11 w-11 rounded-full" style={{ background: `conic-gradient(#4FB3E8 ${fill}%, rgb(var(--color-surface-2)) ${fill}%)` }}><div className="absolute inset-1.5 rounded-full bg-surface" /></div><p className="mt-2 text-[10px] text-muted">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</p></div>})}</div></Card><div className="grid grid-cols-2 gap-4"><Card><p className="text-sm text-muted">Goal streak</p><p className="mt-2 text-3xl font-bold text-water">{stats.streak}</p><p className="text-xs text-muted">days</p></Card><Card><p className="text-sm text-muted">Daily average</p><p className="mt-2 text-3xl font-bold">{stats.average}</p><p className="text-xs text-muted">ml</p></Card></div><p className="text-center text-xs text-muted">Water data is stored on this device.</p></div></div>
}
