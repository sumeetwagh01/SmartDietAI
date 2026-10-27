import { motion, useReducedMotion } from 'framer-motion'
import { Check, Clipboard, RotateCw, Share2, ShieldCheck, ShoppingBasket, Sparkles, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { generateAiPlan, getTodayAiPlan } from '@/api/aiPlan'
import { appendFoodEntries, getFoodLog } from '@/api/foodLog'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DateSwitcher from '@/components/ui/DateSwitcher'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import useApi from '@/hooks/useApi'
import { normalizeAiPlan } from '@/lib/normalizeAiPlan'
import useAiPlanStore from '@/store/aiPlanStore'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { getApiError } from '@/utils/apiError'
import { formatShortDate, shiftDate, toIsoDate } from '@/utils/dates'
import { foodTotals } from '@/utils/food'

const today = toIsoDate(new Date())
const tabs = ['Plan', 'Grocery', 'Why this plan', 'Lifestyle']
const stages = ['Reading your profile…', 'Calculating your targets…', 'Planning your meals…', 'Running safety checks…']
const slots = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['snacks', 'Snacks'], ['dinner', 'Dinner']]
const nutrientRows = [['Calories', 'calories', 'kcal', 'bg-accent'], ['Protein', 'protein_g', 'g', 'bg-protein'], ['Carbs', 'carbs_g', 'g', 'bg-carbs'], ['Fat', 'fat_g', 'g', 'bg-fat'], ['Fibre', 'fibre_g', 'g', 'bg-fibre']]

function ProgressOverlay({ state, message, stage, onRetry, onClose, onProfile }) {
  const reduced = useReducedMotion()
  if (state === 'idle') return null
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-canvas p-5"><div className="w-full max-w-md text-center">{state === 'loading' ? <><motion.div animate={reduced ? {} : { rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-ink"><Sparkles size={32} /></motion.div><h2 className="mt-6 text-2xl font-bold">Building today’s AI plan</h2><p className="mt-3 text-accent">{stages[stage]}</p><p className="mt-2 text-sm text-muted">Waking up the SmartDiet server…</p></> : <Card><h2 className="text-2xl font-bold">Plan generation stopped</h2><p className="mt-3 text-sm leading-6 text-error">{message}</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={onRetry}>Retry</Button><Button variant="secondary" onClick={onProfile}>Review profile</Button><Button variant="ghost" onClick={onClose}>Close</Button></div></Card>}</div></div>
}

function TargetBar({ label, achieved, target, unit, color }) {
  return <div><div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><span className="text-muted">{Math.round(achieved)} / {Math.round(target)} {unit}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${color}`} style={{ width: `${target ? Math.min(100, achieved / target * 100) : 0}%` }} /></div></div>
}

export default function MealPlanAI() {
  const navigate = useNavigate()
  const plans = useAiPlanStore((state) => state.plans)
  const setPlan = useAiPlanStore((state) => state.setPlan)
  const preferences = usePrefsStore((state) => state.aiPreferences)
  const programStart = usePrefsStore((state) => state.programStartDate) || today
  const groceryTicks = useWellnessStore((state) => state.groceryTicks)
  const toggleGrocery = useWellnessStore((state) => state.toggleGrocery)
  const showToast = useToastStore((state) => state.show)
  const [date, setDate] = useState(today)
  const [tab, setTab] = useState('Plan')
  const [confirm, setConfirm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [generation, setGeneration] = useState({ state: 'idle', message: '' })
  const [stage, setStage] = useState(0)
  const planQuery = useApi(async () => normalizeAiPlan(await getTodayAiPlan(date)), { immediate: false, initialData: null, errorMessage: 'Unable to load this AI meal plan.' })
  const logQuery = useApi(() => getFoodLog(date), { immediate: false, errorMessage: 'Unable to load nutrition achieved for this day.' })
  const { execute: loadPlan } = planQuery
  const { execute: loadLog } = logQuery
  useEffect(() => { Promise.all([loadPlan(), loadLog()]).then(([plan]) => { if (plan) setPlan(date, plan) }).catch(() => {}) }, [date, loadLog, loadPlan, setPlan])
  useEffect(() => { if (generation.state !== 'loading') return undefined; const timer = window.setInterval(() => setStage((value) => (value + 1) % stages.length), 1700); return () => window.clearInterval(timer) }, [generation.state])
  const plan = planQuery.data || plans[date] || null
  const allowedDates = useMemo(() => [...new Set([today, ...Object.keys(plans)])].sort(), [plans])
  const achieved = foodTotals(logQuery.data?.entries || [])
  const groceries = useMemo(() => { const seen = new Set(); return slots.map(([slot, label]) => ({ slot, label, items: (plan?.meals?.[slot] || []).flatMap((item) => item.ingredients).filter((ingredient) => { const key = ingredient.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }) })) }, [plan])
  const groceryText = groceries.flatMap(({ label, items }) => items.map((ingredient) => `${label}: ${ingredient}`)).join('\n')

  const generate = async (regenerate = false) => {
    if (generation.state === 'loading') return
    setConfirm(false); setDate(today); setStage(0); setGeneration({ state: 'loading', message: '' })
    try { const generated = normalizeAiPlan(await generateAiPlan({ date: today, preferences, regenerate })); setPlan(today, generated); planQuery.setData(generated); setGeneration({ state: 'idle', message: '' }); showToast('Today’s AI plan is ready.') }
    catch (error) { setGeneration({ state: 'error', message: getApiError(error, "Couldn't generate a safe result right now. Please try again.") }) }
  }
  const ateThis = async (slot, item) => {
    const entry = { food_name: item.name, quantity: item.quantity, unit: item.unit, calories: item.calories, protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g, fibre: item.fibre_g, sodium: item.sodium_mg }
    try { await appendFoodEntries({ date, meal_type: slot === 'snacks' ? 'snack' : slot, entries: [entry] }); await loadLog(); showToast(`${item.name} logged.`) } catch (error) { showToast(getApiError(error, 'Unable to log this meal.'), 'error') }
  }
  const copyList = async () => { try { await navigator.clipboard.writeText(groceryText); showToast('Grocery list copied.') } catch { showToast('Unable to copy the grocery list.', 'error') } }
  const shareList = async () => { if (!navigator.share) return copyList(); try { await navigator.share({ title: 'SmartDiet grocery list', text: groceryText }) } catch (error) { if (error?.name !== 'AbortError') showToast('Unable to share the grocery list.', 'error') } }
  if (planQuery.loading && !plans[date]) return <PageSkeleton />
  if (planQuery.status === 'error' && !plans[date]) return <ErrorState message={planQuery.error} onRetry={() => loadPlan().catch(() => {})} />

  return <Page className="space-y-5"><ProgressOverlay state={generation.state} message={generation.message} stage={stage} onRetry={() => generate(Boolean(plan))} onClose={() => setGeneration({ state: 'idle', message: '' })} onProfile={() => navigate('/profile')} /><ConfirmDialog open={confirm} title="Regenerate today’s plan?" description="This replaces today’s plan and uses another Gemini generation." confirmLabel="Regenerate" loading={generation.state === 'loading'} onCancel={() => setConfirm(false)} onConfirm={() => generate(true)} />
    <header className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><DateSwitcher value={date} onChange={setDate} allowedDates={allowedDates} /><Button variant="secondary" disabled={date !== today} onClick={() => plan ? setConfirm(true) : generate(false)}><RotateCw size={17} />{plan ? 'Regenerate' : 'Generate'}</Button></div><div><p className="text-sm text-accent">AI-generated and safety checked</p><h1 className="text-3xl font-bold">Diet Plan</h1></div></header>
    <Card className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">28-day program</p><p className="mt-1 font-semibold">Start {formatShortDate(programStart)} <span className="text-muted">→</span> Ends {formatShortDate(shiftDate(programStart, 28))}</p></div><span className="rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">Gemini + server validation</span></Card>
    <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl bg-surface-2 p-1" role="tablist">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold ${tab === item ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}>{item}</button>)}</div>
    {!plan ? <Card className="grid min-h-72 place-items-center text-center"><div><Sparkles className="mx-auto text-accent" size={32} /><h2 className="mt-4 text-xl font-bold">No AI plan for this day</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">{date === today ? 'Generate a plan from your saved profile and food preferences. Safety filters are never relaxed.' : 'No saved AI plan exists for this date.'}</p>{date === today ? <Button className="mt-5" onClick={() => generate(false)}>Generate today’s plan with AI</Button> : null}</div></Card> : <>
      {tab === 'Plan' ? <div className="space-y-5"><Card><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">Daily Target</p><p className="text-3xl font-bold text-accent">{Math.round(plan.targets?.calories || 0)} <span className="text-sm font-normal text-muted">kcal</span></p></div><div className="flex flex-wrap gap-2">{nutrientRows.slice(1).map(([label, key, unit]) => <span key={key} className="rounded-full bg-surface-2 px-3 py-2 text-xs"><strong>{Math.round(plan.targets?.[key] || 0)}{unit}</strong> {label}</span>)}</div></div><h2 className="mb-4 font-semibold">Target vs achieved</h2><div className="space-y-4">{nutrientRows.map(([label, key, unit, color]) => <TargetBar key={key} label={label} achieved={key === 'calories' ? achieved.calories : achieved[key.replace('_g', '')]} target={plan.targets?.[key] || 0} unit={unit} color={color} />)}</div></Card><div className="grid gap-4 md:grid-cols-2">{slots.map(([slot, label]) => <Card key={slot}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{label}</h2><span className="text-sm text-muted">{Math.round((plan.meals?.[slot] || []).reduce((sum, item) => sum + item.calories, 0))} kcal</span></div><div className="space-y-2">{(plan.meals?.[slot] || []).map((item, index) => <div key={`${item.name}-${index}`} className="rounded-2xl bg-surface-2 p-3"><button type="button" onClick={() => setDetail(item)} className="w-full text-left"><span className="flex justify-between gap-3"><strong>{item.name}</strong><span>{Math.round(item.calories)} kcal</span></span><span className="mt-1 block text-xs text-muted">{item.quantity} {item.unit}{item.grams != null ? ` · ${item.grams} g` : ''} · P {Math.round(item.protein_g)}g · C {Math.round(item.carbs_g)}g · F {Math.round(item.fat_g)}g · Fibre {Math.round(item.fibre_g)}g</span></button><Button size="sm" variant="ghost" className="mt-2" onClick={() => ateThis(slot, item)}><Utensils size={15} />Ate this</Button></div>)}{!(plan.meals?.[slot] || []).length ? <p className="py-6 text-center text-sm text-muted">No food in this meal.</p> : null}</div></Card>)}</div><Card><div className="flex items-center gap-2 text-fibre"><ShieldCheck size={19} /><h2 className="font-semibold">Safety checks applied</h2></div><div className="mt-4 flex flex-wrap gap-2">{plan.safety?.rules?.map((rule) => <span key={rule} className="rounded-full border border-fibre/30 bg-fibre/10 px-3 py-2 text-xs font-semibold text-fibre">{rule}</span>)}</div></Card></div> : null}
      {tab === 'Grocery' ? <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><ShoppingBasket className="text-accent" />Ingredient list</h2><p className="mt-1 text-sm text-muted">Unique ingredients from this plan; ticks stay on this device.</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={copyList}><Clipboard size={16} />Copy list</Button><Button size="sm" variant="secondary" onClick={shareList}><Share2 size={16} />Share</Button></div></div><div className="mt-6 grid gap-5 md:grid-cols-2">{groceries.map(({ slot, label, items }) => <section key={slot}><h3 className="mb-2 font-semibold">{label}</h3><div className="space-y-2">{items.map((ingredient) => { const id = `${date}:${ingredient.toLowerCase()}`; const checked = Boolean(groceryTicks[id]); return <label key={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 py-2"><input type="checkbox" checked={checked} onChange={() => toggleGrocery(id)} className="h-5 w-5 accent-[#D9EC7D]" /><span className={checked ? 'text-muted line-through' : ''}>{ingredient}</span>{checked ? <Check className="ml-auto text-accent" size={17} /> : null}</label> })}</div></section>)}</div></Card> : null}
      {tab === 'Why this plan' ? <div className="grid gap-4 md:grid-cols-2">{Object.entries(plan.why_this_plan || {}).map(([key, value]) => <Card key={key}><p className="text-xs font-semibold uppercase tracking-wider text-accent">{key.replaceAll('_', ' ')}</p><p className="mt-3 text-sm leading-6 text-muted">{value || 'Not provided.'}</p></Card>)}{plan.tips?.length ? <Card><h2 className="font-semibold">Practical tips</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">{plan.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></Card> : null}{plan.cautions?.length ? <Card className="border-carbs/30 bg-carbs/10"><h2 className="font-semibold text-carbs">Cautions</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">{plan.cautions.map((item) => <li key={item}>{item}</li>)}</ul></Card> : null}</div> : null}
      {tab === 'Lifestyle' ? <div className="grid gap-4 md:grid-cols-2"><Card><p className="text-sm text-water">Hydration</p><h2 className="mt-1 text-xl font-bold">{plan.targets?.water_ml || 'Set your'} ml daily goal</h2><Button className="mt-5" variant="secondary" onClick={() => navigate('/dashboard', { state: { tab: 'water' } })}>Open Water</Button></Card><Card><p className="text-sm text-accent">Fasting routine</p><h2 className="mt-1 text-xl font-bold">{preferences?.fasting && preferences.fasting !== 'none' ? preferences.fasting : 'No fasting window selected'}</h2><Button className="mt-5" variant="secondary" onClick={() => navigate('/dashboard', { state: { tab: 'fasting' } })}>Open Fasting</Button></Card>{plan.tips?.[0] ? <Card className="md:col-span-2"><h2 className="font-semibold">Practical tip</h2><p className="mt-2 text-sm leading-6 text-muted">{plan.tips[0]}</p></Card> : null}</div> : null}
      <Card className="border-accent/20 bg-accent/5"><p className="text-sm leading-6 text-muted"><strong className="text-ink">AI-generated estimates, not medical advice.</strong> Check with your doctor or dietitian, especially with a medical condition or allergy.</p></Card>
    </>}
    <BottomSheet open={Boolean(detail)} title={detail?.name || 'Meal details'} onClose={() => setDetail(null)}>{detail ? <div className="space-y-5"><p className="text-sm text-muted">{detail.quantity} {detail.unit}{detail.grams != null ? ` · ${detail.grams} g` : ''}</p><div><h3 className="font-semibold">Ingredients</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{detail.ingredients.map((item) => <li key={item}>{item}</li>)}</ul></div>{detail.prep_note ? <div><h3 className="font-semibold">Preparation</h3><p className="mt-2 text-sm text-muted">{detail.prep_note}</p></div> : null}</div> : null}</BottomSheet>
  </Page>
}
