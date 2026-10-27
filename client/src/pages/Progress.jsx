import { Download, Flame, Info, Plus, Scale } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { getTargets } from '@/api/aiPlan'
import { addWeight, getProgress, getWeightHistory } from '@/api/progress'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import useApi from '@/hooks/useApi'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import { getApiError } from '@/utils/apiError'
import { lastDates, shiftDate, toIsoDate } from '@/utils/dates'
import { normalizeAiTargets } from '@/lib/normalizeAiPlan'

const today = toIsoDate(new Date())
const ranges = { Today: 1, Week: 7, '30 Days': 30 }
const asRows = (value) => Array.isArray(value) ? value : value?.entries || []
const value = (row, key) => Number(row?.[key] ?? 0) || 0
const dayLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

function ChartFrame({ title, subtitle, children, empty }) {
  return <Card><h2 className="text-lg font-bold">{title}</h2><p className="mb-5 mt-1 text-sm text-muted">{subtitle}</p>{empty ? <div className="grid h-64 place-items-center text-center text-sm text-muted">No data for this range.</div> : <div className="h-72 w-full">{children}</div>}</Card>
}

export default function Progress() {
  const [range, setRange] = useState('Week')
  const [weightSheet, setWeightSheet] = useState(false)
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [showFormula, setShowFormula] = useState(false)
  const theme = usePrefsStore((state) => state.theme)
  const showToast = useToastStore((state) => state.show)
  const rangeDays = ranges[range]
  const fromDate = shiftDate(today, 1 - rangeDays)

  const rangeQuery = useApi(() => getProgress(fromDate, today), { immediate: false, initialData: [], errorMessage: 'Unable to load progress for this range.' })
  const overview = useApi(async () => {
    const [logs, weights, targetPayload] = await Promise.all([getProgress(shiftDate(today, -59), today), getWeightHistory(), getTargets()])
    return { logs: asRows(logs), weights: asRows(weights), targets: normalizeAiTargets(targetPayload?.targets) }
  }, { errorMessage: 'Unable to load your progress.' })
  const { execute: loadRange } = rangeQuery
  useEffect(() => { Promise.resolve().then(() => loadRange().catch(() => {})) }, [fromDate, loadRange])

  const target = Number(overview.data?.targets?.calories) || 0
  const estimateTarget = false
  const rows = asRows(rangeQuery.data)
  const dates = useMemo(() => lastDates(today, rangeDays), [rangeDays])
  const chartData = useMemo(() => {
    const map = new Map(rows.map((row) => [row.date, row]))
    return dates.map((date) => { const row = map.get(date); return { date, day: dayLabel(date), calories: row ? value(row, 'total_calories') : null, target, protein: row ? value(row, 'total_protein_g') : null, carbs: row ? value(row, 'total_carbs_g') : null, fat: row ? value(row, 'total_fat_g') : null } })
  }, [dates, rows, target])
  const loggedDays = rows.filter((row) => row?.date)
  const adherentDays = loggedDays.filter((row) => target && Math.abs(value(row, 'total_calories') - target) / target <= 0.1).length
  const consistency = loggedDays.length ? Math.round(((loggedDays.length / rangeDays) * 0.6 + (adherentDays / loggedDays.length) * 0.4) * 100) : 0
  const loggedSet = new Set((overview.data?.logs || []).map((row) => row.date))
  let streak = 0
  while (streak < 60 && loggedSet.has(shiftDate(today, -streak))) streak += 1
  const streakLabel = streak >= 60 ? '60+' : String(streak)
  const weightData = (overview.data?.weights || []).filter((item) => item.date >= fromDate && item.date <= today).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((item) => ({ ...item, day: dayLabel(item.date), weight: Number(item.weight_kg) }))
  const palette = theme === 'dark' ? { grid: '#2A2A2E', text: '#9A9AA0', tooltip: '#1B1B1E', border: '#2A2A2E' } : { grid: '#E4E7EB', text: '#64748B', tooltip: '#FFFFFF', border: '#E4E7EB' }
  const tooltip = { borderRadius: 16, borderColor: palette.border, background: palette.tooltip, color: theme === 'dark' ? '#F4F4F5' : '#0F172A' }

  const saveWeight = async (event) => {
    event.preventDefault()
    if (!weight || saving) return
    setSaving(true)
    try { const saved = await addWeight(Number(weight), today); overview.setData({ ...overview.data, weights: [...(overview.data?.weights || []), saved] }); setWeight(''); setWeightSheet(false); showToast('Weight logged.') }
    catch (error) { showToast(getApiError(error, 'Unable to log weight.'), 'error') }
    finally { setSaving(false) }
  }
  const downloadCsv = useCallback(() => {
    const header = ['date', 'calories', 'calorie_target', 'protein_g', 'carbs_g', 'fat_g']
    const lines = chartData.map((row) => [row.date, row.calories ?? '', row.target, row.protein ?? '', row.carbs ?? '', row.fat ?? ''].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `smartdiet-progress-${fromDate}-to-${today}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [chartData, fromDate])

  if (overview.loading) return <PageSkeleton />
  if (overview.status === 'error') return <ErrorState message={overview.error} onRetry={() => overview.retry().catch(() => {})} />
  return <Page className="space-y-5"><header><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-accent">Your trends</p><h1 className="text-3xl font-bold">Progress</h1></div><div className="flex items-center gap-2"><span className="flex min-h-11 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 text-sm font-semibold text-accent"><Flame size={17} />Streak: {streakLabel} days</span><Button variant="secondary" onClick={downloadCsv}><Download size={17} /><span className="hidden sm:inline">Download report</span></Button></div></div></header>
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-1" role="tablist">{Object.keys(ranges).map((item) => <button key={item} type="button" role="tab" aria-selected={range === item} onClick={() => setRange(item)} className={`min-h-11 rounded-xl text-sm font-semibold ${range === item ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}>{item}</button>)}</div>
    {rangeQuery.loading || rangeQuery.status === 'idle' ? <div className="space-y-4"><div className="skeleton h-52" /><div className="grid gap-4 lg:grid-cols-2"><div className="skeleton h-80" /><div className="skeleton h-80" /></div></div> : rangeQuery.status === 'error' ? <ErrorState message={rangeQuery.error} onRetry={() => rangeQuery.retry().catch(() => {})} /> : !loggedDays.length ? <Card className="grid min-h-64 place-items-center text-center"><div><p className="text-xl font-bold">Log a few meals to see your data here.</p><p className="mt-2 text-sm text-muted">Your calorie, macro and consistency trends will appear as you log food.</p></div></Card> : <>
      <Card><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">Consistency Score</h2><button type="button" aria-expanded={showFormula} onClick={() => setShowFormula((open) => !open)} className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Explain consistency score"><Info size={17} /></button></div><p className="text-sm text-muted">{loggedDays.length} of {rangeDays} days logged · {adherentDays} within target</p></div><div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#D9EC7D ${consistency}%, ${palette.grid} 0)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-surface text-xl font-bold">{consistency}%</div></div></div>{showFormula ? <div role="status" className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm leading-6 text-muted"><strong className="text-ink">Formula:</strong> 60% logging consistency (days logged ÷ days in range) + 40% calorie adherence (logged days within ±10% of the calorie target). {estimateTarget ? <span> The current target is an estimate because no plan is available.</span> : null}</div> : null}</Card>
      <div className="grid gap-4 xl:grid-cols-2"><ChartFrame title="Calories vs target" subtitle={`${dayLabel(fromDate)} – ${dayLabel(today)}${estimateTarget ? ' · target is estimated' : ''}`} empty={!loggedDays.length}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" stroke={palette.text} tickLine={false} axisLine={false} /><YAxis stroke={palette.text} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltip} /><Legend /><Line type="monotone" dataKey="calories" stroke="#D9EC7D" strokeWidth={3} connectNulls={false} /><Line type="monotone" dataKey="target" stroke="#9A9AA0" strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></ChartFrame>
        <ChartFrame title="Daily macros" subtitle="Protein, carbs and fat in grams" empty={!loggedDays.length}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" stroke={palette.text} tickLine={false} axisLine={false} /><YAxis stroke={palette.text} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltip} /><Legend /><Bar dataKey="protein" stackId="macro" fill="#6AA9FF" radius={[0, 0, 0, 0]} /><Bar dataKey="carbs" stackId="macro" fill="#F5B84B" /><Bar dataKey="fat" stackId="macro" fill="#F0806A" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></ChartFrame>
      </div>
      <ChartFrame title="Weight history" subtitle="Weight entries in the selected range" empty={!weightData.length}><ResponsiveContainer width="100%" height="100%"><LineChart data={weightData}><CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" stroke={palette.text} tickLine={false} axisLine={false} /><YAxis stroke={palette.text} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip contentStyle={tooltip} /><Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#6FD08C" strokeWidth={3} /></LineChart></ResponsiveContainer></ChartFrame>
    </>}
    <Button className="fixed bottom-24 right-5 z-20 shadow-soft lg:bottom-8 lg:right-8" onClick={() => setWeightSheet(true)}><Plus size={18} /><Scale size={18} />Add weight</Button>
    <BottomSheet open={weightSheet} title="Add weight" onClose={() => setWeightSheet(false)}><form className="space-y-4" onSubmit={saveWeight}><Input label="Weight (kg)" type="number" min="1" max="500" step="0.1" required value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="70.0" /><Button type="submit" className="w-full" loading={saving} loadingLabel="Saving…">Save weight</Button></form></BottomSheet>
  </Page>
}
