import { Bot, Check, ChevronRight, Droplets, Info, Plus, Settings2, Sparkles, Utensils, Weight } from 'lucide-react'
import { useState } from 'react'

import MacroBars from '@/components/dashboard/MacroBars'
import SemiCircleGauge from '@/components/dashboard/SemiCircleGauge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { lastDates } from '@/utils/dates'
import { foodTotals, mealLabels, mealSlots } from '@/utils/food'

const tileMeta = {
  weight: ['Weight', 'kg', Weight, 'text-accent'], calories: ['Calories', 'kcal', Utensils, 'text-accent'],
  protein: ['Protein', 'g', Utensils, 'text-protein'], carbs: ['Carbs', 'g', Utensils, 'text-carbs'],
  fat: ['Fat', 'g', Utensils, 'text-fat'], fibre: ['Fibre', 'g', Utensils, 'text-fibre'], water: ['Water', 'ml', Droplets, 'text-water'],
}

function MiniBars({ values = [], color = 'bg-accent' }) {
  const max = Math.max(...values, 1)
  return <div className="mt-4 flex h-7 items-end gap-1">{values.map((value, index) => <span key={index} className={`min-h-1 flex-1 rounded-full ${color}`} style={{ height: `${Math.max(12, (value / max) * 100)}%`, opacity: value ? 1 : 0.2 }} />)}</div>
}

export default function OverallTab({ date, entries, assignments, plan, target, aiTargets, weekly, latestWeight, waterByDate, reportTiles, toggleReportTile, onOpenMeal, onGenerate, generating, generateError, profileComplete, isToday, onReviewProfile, onOpenWeight, onAddWater, onLogFood, suggestion, suggestionLoading, suggestionError, retrySuggestion, onDateChange }) {
  const [customizing, setCustomizing] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [showCalculation, setShowCalculation] = useState(false)
  const totals = foodTotals(entries)
  const targets = {
    P: aiTargets?.protein_g || 0,
    C: aiTargets?.carbs_g || 0,
    F: aiTargets?.fat_g || 0,
  }
  const dates = lastDates(date)
  const rowsByDate = new Map(weekly.map((row) => [row.date, row]))
  const weightHistory = latestWeight?.history || []
  const valuesFor = (tile) => dates.map((day) => {
    const row = rowsByDate.get(day) || {}
    if (tile === 'weight') return weightHistory.find((item) => item.date === day)?.weight_kg || 0
    if (tile === 'water') return waterByDate[day] || 0
    if (tile === 'fibre') return day === date ? totals.fibre : 0
    if (tile === 'calories') return row.total_calories || 0
    return row[`total_${tile}_g`] || 0
  })
  const currentValue = (tile) => tile === 'weight' ? latestWeight?.weight_kg || 0 : tile === 'water' ? waterByDate[date] || 0 : totals[tile] || 0

  return <div className="grid gap-5 lg:grid-cols-2">
    <Card><div className="mb-3 flex items-center justify-between"><div><p className="text-sm text-muted">Today&apos;s Count</p><h2 className="text-xl font-bold">Energy balance</h2></div><button type="button" onClick={() => setShowCalculation((value) => !value)} className="flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold text-accent"><Info size={16} />How was this calculated?</button></div><SemiCircleGauge eaten={totals.calories} target={target} estimated={false} /><div className="mt-6"><MacroBars current={{ P: totals.protein, C: totals.carbs, F: totals.fat }} target={targets} /></div>{showCalculation ? <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm leading-6 text-muted"><p><strong className="text-ink">BMR:</strong> {Math.round(aiTargets?.calculation?.bmr_kcal || 0)} kcal · <strong className="text-ink">TDEE:</strong> {Math.round(aiTargets?.calculation?.tdee_kcal || 0)} kcal · <strong className="text-ink">Goal adjustment:</strong> {Math.round(aiTargets?.calculation?.goal_adjustment_kcal || 0)} kcal</p>{aiTargets?.rationale ? <p className="mt-2">{aiTargets.rationale}</p> : null}{aiTargets?.cautions?.length ? <ul className="mt-2 list-disc pl-5">{aiTargets.cautions.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div> : null}</Card>

    {!plan ? <Card className={isToday ? 'border-accent/30 bg-accent/10' : ''}><div className="flex h-full flex-col items-start justify-between gap-4"><div><div className="flex items-center gap-2 font-semibold"><Sparkles size={19} className="text-accent" />{isToday ? 'Generate today’s plan' : 'No plan for this day'}</div><p className="mt-2 text-sm leading-6 text-muted">{isToday ? profileComplete ? 'Build meals around your saved health profile and goals.' : 'Complete your profile before generating a safe plan.' : 'Plans are available only when saved in your recent plan history.'}</p>{generateError ? <p className="mt-2 text-sm text-error">{generateError}</p> : null}</div>{isToday ? <div className="flex flex-wrap gap-2"><Button disabled={!profileComplete} loading={generating} loadingLabel="Waking up the SmartDiet server…" onClick={onGenerate}>Generate plan</Button>{!profileComplete ? <Button variant="secondary" onClick={onReviewProfile}>Review profile</Button> : null}</div> : null}</div></Card> : <Card><div className="flex items-center gap-2 text-fibre"><Check size={19} /><h2 className="font-semibold">Today&apos;s plan is ready</h2></div><p className="mt-3 text-sm leading-6 text-muted">Tap any meal below to compare what was planned with what you logged.</p><p className="mt-5 text-3xl font-bold">{Math.round(plan.calorie_target || plan.totals.calories)} <span className="text-sm font-normal text-muted">kcal target</span></p></Card>}

    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Meals</h2><Button size="sm" variant="ghost" onClick={onLogFood}><Plus size={16} />Add food</Button></div><div className="grid grid-cols-2 gap-3">{mealSlots.map((slot) => { const logged = foodTotals(entries.filter((_, index) => assignments[index] === slot)).calories; const planned = plan ? foodTotals(plan.meals[slot]).calories : null; return <button key={slot} type="button" onClick={() => onOpenMeal(slot)} className="min-h-28 rounded-card border border-line bg-surface p-4 text-left transition hover:border-accent"><div className="flex items-center justify-between"><span className="font-semibold">{mealLabels[slot]}</span><ChevronRight size={17} className="text-muted" /></div><p className="mt-5 text-xl font-bold">{Math.round(logged)} <span className="text-xs font-normal text-muted">/ {planned == null ? '—' : Math.round(planned)} kcal</span></p></button> })}</div></section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Report</h2><button type="button" onClick={() => setCustomizing((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted"><Settings2 size={16} />Customize</button></div>{customizing ? <Card className="mb-3"><p className="mb-3 text-sm text-muted">Choose the tiles shown on Home.</p><div className="flex flex-wrap gap-2">{Object.entries(tileMeta).map(([key, [label]]) => <button key={key} type="button" onClick={() => toggleReportTile(key)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${reportTiles.includes(key) ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}>{reportTiles.includes(key) ? <Check size={15} /> : null}{label}</button>)}</div></Card> : null}<div className="grid grid-cols-2 gap-3">{reportTiles.map((tile) => { const [label, unit, Icon, color] = tileMeta[tile] || tileMeta.calories; return <button key={tile} type="button" onClick={tile === 'weight' ? onOpenWeight : undefined} className="rounded-card border border-line bg-surface p-4 text-left"><Icon size={18} className={color} /><p className="mt-3 text-xs text-muted">{label}</p><p className={`text-xl font-bold ${color}`}>{Math.round(currentValue(tile))} <span className="text-xs font-normal text-muted">{unit}</span>{tile === 'weight' ? <span className="ml-2 text-xs font-semibold text-accent">+ Add</span> : null}</p><MiniBars values={valuesFor(tile)} color={color.replace('text-', 'bg-')} /></button> })}</div></section>

    <section className="lg:col-span-2"><h2 className="mb-3 text-lg font-bold">Insights</h2><div className="scrollbar-none flex snap-x gap-3 overflow-x-auto pb-2"><Card className="min-w-[300px] snap-start"><p className="text-sm font-semibold">Last 7 days</p><div className="mt-4 grid grid-cols-7 gap-2">{dates.map((day) => <button key={day} type="button" onClick={() => onDateChange(day)} className={`min-h-14 rounded-xl text-center text-xs ${day === date ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}><span className="block">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span><span className={`mx-auto mt-2 block h-1.5 w-1.5 rounded-full ${rowsByDate.has(day) ? 'bg-fibre' : 'bg-muted/20'}`} /></button>)}</div></Card><Card className="min-w-[280px] snap-start"><div className="flex items-center gap-2 text-accent"><Bot size={18} /><p className="text-sm font-semibold">NutriBites tip</p></div>{suggestionLoading ? <div className="mt-4 space-y-2"><div className="skeleton h-3" /><div className="skeleton h-3 w-4/5" /></div> : suggestionError ? <div><p className="mt-4 text-sm text-muted">Tip unavailable.</p><button type="button" onClick={retrySuggestion} className="mt-2 min-h-11 text-sm font-semibold text-accent">Retry</button></div> : <p className="mt-4 text-sm leading-6 text-muted">{suggestion || 'Tip unavailable.'}</p>}</Card><Card className="min-w-[260px] snap-start"><p className="text-sm font-semibold">Plan status</p><p className="mt-4 text-2xl font-bold">{plan ? 'Ready' : 'Not generated'}</p><p className="mt-1 text-sm text-muted">{plan ? 'Your planned meals are available.' : isToday ? 'Generate a plan to get started.' : 'No plan for this day.'}</p></Card></div></section>

    <div className="fixed bottom-24 right-5 z-30 lg:bottom-7 lg:right-8">{speedOpen ? <div className="mb-3 flex flex-col items-end gap-2">{[[onLogFood, Utensils, 'Log food'], [onOpenWeight, Weight, 'Add weight'], [onAddWater, Droplets, 'Add water']].map(([action, Icon, label]) => <button key={label} type="button" onClick={() => { action(); setSpeedOpen(false) }} className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold shadow-soft"><Icon size={17} />{label}</button>)}</div> : null}<button type="button" onClick={() => setSpeedOpen((value) => !value)} className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-soft" aria-label="Quick add"><Plus className={`transition ${speedOpen ? 'rotate-45' : ''}`} /></button></div>
  </div>
}
