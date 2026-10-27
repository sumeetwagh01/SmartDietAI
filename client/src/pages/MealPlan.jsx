import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Clipboard, Info, RotateCw, Share2, ShoppingBasket, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getFoodLog } from '@/api/foodLog'
import { generateAiPlan, getTodayAiPlan } from '@/api/aiPlan'
import { getFood } from '@/api/nutrition'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DateSwitcher from '@/components/ui/DateSwitcher'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import useApi from '@/hooks/useApi'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { getApiError, isValidationError } from '@/utils/apiError'
import { formatShortDate, shiftDate, toIsoDate } from '@/utils/dates'
import { foodTotals, mealLabels, mealSlots } from '@/utils/food'
import normalizePlan from '@/utils/normalizePlan'

// Legacy page retained only for compatibility; the router uses MealPlanAI.
const getTodayPlan = () => getTodayAiPlan(toIsoDate(new Date()))
const getHistory = async () => []
const generatePlan = () => generateAiPlan({ date: toIsoDate(new Date()) })

const today = toIsoDate(new Date())
const tabs = ['Plan', 'Grocery', 'Why this plan', 'Lifestyle']
const stages = ['Checking your health profile…', 'Filtering unsafe foods…', 'Optimizing your meals…', 'Writing your explanations…']
const nutrients = [['Calories', 'calories', 'kcal', 'bg-accent'], ['Protein', 'protein', 'g', 'bg-protein'], ['Carbs', 'carbs', 'g', 'bg-carbs'], ['Fat', 'fat', 'g', 'bg-fat'], ['Fibre', 'fibre', 'g', 'bg-fibre']]
const planDate = (item) => item?.date || item?.plan_date || item?.created_at?.slice?.(0, 10) || null
const targetsOf = (plan) => ({ calories: Number(plan?.calorie_target ?? plan?.targets?.target_calories ?? plan?.totals?.calories) || 0, protein: Number(plan?.targets?.protein_g ?? plan?.totals?.protein) || 0, carbs: Number(plan?.targets?.carbs_g ?? plan?.totals?.carbs) || 0, fat: Number(plan?.targets?.fat_g ?? plan?.totals?.fat) || 0, fibre: Number(plan?.targets?.fibre_g ?? plan?.totals?.fibre) || 0 })
const formatValue = (value) => Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Applied' : 'No') : String(value ?? '')

function ProgressOverlay({ state, message, validation, stage, onRetry, onClose, onProfile }) {
  const reduced = useReducedMotion()
  if (state === 'idle') return null
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-canvas p-5"><div className="w-full max-w-md text-center">{state === 'loading' ? <><motion.div animate={reduced ? {} : { rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-ink"><Sparkles size={32} /></motion.div><h2 className="mt-6 text-2xl font-bold">Building today’s plan</h2><AnimatePresence mode="wait"><motion.p key={stage} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-accent">{stages[stage]}</motion.p></AnimatePresence><p className="mt-2 text-sm text-muted">Waking up the SmartDiet server…</p></> : <Card><h2 className="text-2xl font-bold">Plan generation stopped</h2>{validation ? <><p className="mt-3 font-semibold text-error">Too few foods after clinical filter</p><p className="mt-2 text-sm leading-6 text-muted">Your profile may be too restrictive to build a safe plan. SmartDiet will never relax allergy or medical filters automatically.</p></> : <p className="mt-3 text-sm text-error">{message}</p>}<div className="mt-6 flex flex-wrap justify-center gap-2">{validation ? <Button onClick={onProfile}>Go to Profile</Button> : <Button onClick={onRetry}>Retry</Button>}<Button variant="secondary" onClick={onClose}>Close</Button></div></Card>}</div></div>
}

function TargetBar({ label, achieved, target, unit, color }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{label}</span><span className="text-muted">{Math.round(achieved)} / {Math.round(target)} {unit}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${color}`} style={{ width: `${target ? Math.min(100, achieved / target * 100) : 0}%` }} /></div></div>
}

function FoodDetail({ item, open, onClose }) {
  const query = useApi(() => getFood(item.id), { immediate: false, errorMessage: 'Unable to load food details.' })
  const { execute: loadFood } = query
  useEffect(() => { if (open && item?.id != null) loadFood().catch(() => {}) }, [open, item?.id, loadFood])
  const food = query.data || item
  return <BottomSheet open={open} title={item?.food_name || 'Food details'} onClose={onClose}>{item?.id != null && query.loading ? <div className="skeleton h-40" /> : item?.id != null && query.status === 'error' ? <ErrorState message={query.error} onRetry={() => query.retry().catch(() => {})} /> : <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{nutrients.map(([label, key, unit]) => <div key={key} className="rounded-2xl bg-surface-2 p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-bold">{Math.round(Number(food?.[key] ?? food?.[`${key}_g`]) || 0)} {unit}</p></div>)}</div><div><p className="text-sm font-semibold">Serving</p><p className="mt-1 text-muted">{item?.quantity || '—'} {item?.unit || ''}</p></div>{item?.id == null && <p className="flex gap-2 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted"><Info className="mt-0.5 shrink-0" size={16} />This item has no food ID, so this is the nutrition supplied with your plan.</p>}</div>}</BottomSheet>
}

export default function MealPlan() {
  const navigate = useNavigate()
  const [date, setDate] = useState(today)
  const [tab, setTab] = useState('Plan')
  const [confirm, setConfirm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [generation, setGeneration] = useState({ state: 'idle', message: '', validation: false })
  const [stage, setStage] = useState(0)
  const prefs = usePrefsStore()
  const groceryTicks = useWellnessStore((state) => state.groceryTicks)
  const toggleGrocery = useWellnessStore((state) => state.toggleGrocery)
  const showToast = useToastStore((state) => state.show)
  const query = useApi(async () => {
    const [current, history] = await Promise.all([getTodayPlan(), getHistory()])
    const plans = (Array.isArray(history) ? history : []).reduce((map, item) => { const itemDate = planDate(item); if (itemDate) map[itemDate] = normalizePlan(item); return map }, {})
    const currentPlan = normalizePlan(current)
    if (currentPlan) plans[today] = currentPlan
    return plans
  }, { initialData: {}, errorMessage: 'Unable to load your meal plans.' })
  const logQuery = useApi(() => getFoodLog(date), { immediate: false, errorMessage: 'Unable to load nutrition achieved for this day.' })
  const { execute: loadLog } = logQuery
  useEffect(() => { Promise.resolve().then(() => loadLog().catch(() => {})) }, [date, loadLog])
  useEffect(() => { if (generation.state !== 'loading') return undefined; const timer = window.setInterval(() => setStage((value) => (value + 1) % stages.length), 1700); return () => window.clearInterval(timer) }, [generation.state])

  const dates = useMemo(() => [...new Set([today, ...Object.keys(query.data || {})])].sort(), [query.data])
  const plan = query.data?.[date] || null
  const achieved = foodTotals(logQuery.data?.entries || [])
  const targets = targetsOf(plan)
  const startDate = prefs.programStartDate || today
  const grocery = useMemo(() => {
    const seen = new Set()
    return mealSlots.map((slot) => ({ slot, items: (plan?.meals?.[slot] || []).filter((item) => { const key = String(item.food_name).toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }) }))
  }, [plan])
  const groceryText = grocery.flatMap(({ slot, items }) => items.map((item) => `${mealLabels[slot]}: ${item.food_name}${item.quantity ? ` — ${item.quantity} ${item.unit || ''}` : ''}`)).join('\n')
  const regenerate = useCallback(async () => {
    if (generation.state === 'loading') return
    setConfirm(false); setDate(today); setStage(0); setGeneration({ state: 'loading', message: '', validation: false })
    try { const generated = normalizePlan(await generatePlan()); query.setData({ ...(query.data || {}), [today]: generated }); if (!prefs.programStartDate) prefs.setProgramStartDate(today); setGeneration({ state: 'idle', message: '', validation: false }); showToast('Today’s plan is ready.') }
    catch (error) { setGeneration({ state: 'error', message: getApiError(error, 'Unable to generate your meal plan.'), validation: isValidationError(error) }) }
  }, [generation.state, prefs, query, showToast])
  const copyList = async () => { try { await navigator.clipboard.writeText(groceryText); showToast('Grocery list copied.') } catch { showToast('Unable to copy the grocery list.', 'error') } }
  const shareList = async () => { if (!navigator.share) return copyList(); try { await navigator.share({ title: 'SmartDiet grocery list', text: groceryText }) } catch (error) { if (error?.name !== 'AbortError') showToast('Unable to share the grocery list.', 'error') } }

  if (query.loading) return <PageSkeleton />
  if (query.status === 'error') return <ErrorState message={query.error} onRetry={() => query.retry().catch(() => {})} />
  return <Page className="space-y-5"><ProgressOverlay state={generation.state} message={generation.message} validation={generation.validation} stage={stage} onRetry={regenerate} onClose={() => setGeneration({ state: 'idle', message: '', validation: false })} onProfile={() => navigate('/profile')} /><ConfirmDialog open={confirm} title="Regenerate today’s plan?" description="This replaces today’s plan." confirmLabel="Regenerate" loading={generation.state === 'loading'} onCancel={() => setConfirm(false)} onConfirm={regenerate} />
    <header className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><DateSwitcher value={date} onChange={setDate} allowedDates={dates} /><Button variant="secondary" disabled={date !== today} onClick={() => plan ? setConfirm(true) : regenerate()}><RotateCw size={17} />Regenerate</Button></div><div><p className="text-sm text-accent">Meals designed around you</p><h1 className="text-3xl font-bold">Diet Plan</h1></div></header>
    <Card className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">28-day program</p><p className="mt-1 font-semibold">Start {formatShortDate(startDate)} <span className="text-muted">→</span> Ends {formatShortDate(shiftDate(startDate, 28))}</p></div><div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 sm:w-52"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(4, ((new Date(`${today}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000 + 1) / 28 * 100))}%` }} /></div></Card>
    <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl bg-surface-2 p-1" role="tablist">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold ${tab === item ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}>{item}</button>)}</div>
    {!plan ? <Card className="grid min-h-72 place-items-center text-center"><div><Sparkles className="mx-auto text-accent" size={32} /><h2 className="mt-4 text-xl font-bold">No plan for this day</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">{date === today ? 'Build today’s plan from your saved profile and clinical filters.' : 'Only saved plans are available for past dates.'}</p>{date === today && <Button className="mt-5" onClick={regenerate}>Generate today’s plan</Button>}</div></Card> : <>
      {tab === 'Plan' && <div className="space-y-5"><Card><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">Daily Target</p><p className="text-3xl font-bold text-accent">{Math.round(targets.calories)} <span className="text-sm font-normal text-muted">kcal</span></p></div><div className="flex flex-wrap gap-2">{nutrients.slice(1).map(([label, key, unit]) => <span key={key} className="rounded-full bg-surface-2 px-3 py-2 text-xs"><strong>{Math.round(targets[key])}{unit}</strong> {label}</span>)}</div></div><h2 className="mb-4 font-semibold">Target vs achieved</h2><div className="space-y-4">{nutrients.map(([label, key, unit, color]) => <TargetBar key={key} label={label} achieved={achieved[key]} target={targets[key]} unit={unit} color={color} />)}</div>{logQuery.status === 'error' && <p className="mt-4 text-sm text-error">{logQuery.error} <button type="button" className="underline" onClick={() => logQuery.retry().catch(() => {})}>Retry</button></p>}</Card>
        <div className="grid gap-4 md:grid-cols-2">{mealSlots.map((slot) => <Card key={slot}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{mealLabels[slot]}</h2><span className="text-sm text-muted">{Math.round(foodTotals(plan.meals[slot]).calories)} kcal</span></div><div className="space-y-1">{plan.meals[slot].map((item, index) => <button type="button" key={`${item.food_name}-${index}`} onClick={() => setDetail(item)} className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl px-3 py-2 text-left hover:bg-surface-2"><span><span className="block font-medium">{item.food_name}</span><span className="text-xs text-muted">{item.quantity || '—'} {item.unit || ''} · P {Math.round(item.protein_g)}g · C {Math.round(item.carbs_g)}g · F {Math.round(item.fat_g)}g</span></span><span className="shrink-0 text-sm font-semibold">{Math.round(item.calories)} kcal</span></button>)}{!plan.meals[slot].length && <p className="py-7 text-center text-sm text-muted">No food in this meal.</p>}</div></Card>)}</div>
        {plan.constraint_summary && <Card><h2 className="font-semibold">Clinical and dietary constraints applied</h2><div className="mt-4 flex flex-wrap gap-2">{Object.entries(plan.constraint_summary).filter(([, value]) => value !== false && value != null && formatValue(value)).map(([key, value]) => <span key={key} className="rounded-full border border-line bg-surface-2 px-3 py-2 text-xs"><strong className="capitalize">{key.replaceAll('_', ' ')}:</strong> {formatValue(value)}</span>)}</div></Card>}
      </div>}
      {tab === 'Grocery' && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><ShoppingBasket className="text-accent" />Grocery list</h2><p className="mt-1 text-sm text-muted">Checked items stay saved on this device for {formatShortDate(date)}.</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={copyList}><Clipboard size={16} />Copy list</Button><Button size="sm" variant="secondary" onClick={shareList}><Share2 size={16} />Share</Button></div></div><div className="mt-6 grid gap-5 md:grid-cols-2">{grocery.map(({ slot, items }) => <section key={slot}><h3 className="mb-2 font-semibold">{mealLabels[slot]}</h3><div className="space-y-2">{items.map((item) => { const id = `${date}:${slot}:${item.food_name.toLowerCase()}`; const checked = Boolean(groceryTicks[id]); return <label key={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 py-2"><input type="checkbox" checked={checked} onChange={() => toggleGrocery(id)} className="h-5 w-5 accent-[#D9EC7D]" /><span className={checked ? 'text-muted line-through' : ''}>{item.food_name} <span className="text-sm text-muted">{item.quantity || ''} {item.unit || ''}</span></span>{checked && <Check className="ml-auto text-accent" size={17} />}</label>})}{!items.length && <p className="text-sm text-muted">Nothing listed.</p>}</div></section>)}</div></Card>}
      {tab === 'Why this plan' && (plan.explanation ? <div className="grid gap-4 md:grid-cols-2">{['calorie_reason', 'protein_reason', 'condition_reason', 'excluded_foods', 'practical_tip'].map((key) => <Card key={key}><p className="text-xs font-semibold uppercase tracking-wider text-accent">{key.replaceAll('_', ' ')}</p><p className="mt-3 text-sm leading-6 text-muted">{typeof plan.explanation === 'string' ? (key === 'practical_tip' ? plan.explanation : 'Not provided.') : formatValue(plan.explanation[key]) || 'Not provided.'}</p></Card>)}</div> : <Card className="grid min-h-52 place-items-center text-center"><div><Sparkles className="mx-auto text-muted" /><p className="mt-4 font-semibold">AI explanation unavailable right now</p><p className="mt-2 text-sm text-muted">Your clinically filtered meal plan is still available.</p></div></Card>)}
      {tab === 'Lifestyle' && <div className="grid gap-4 md:grid-cols-2"><Card><p className="text-sm text-water">Hydration</p><h2 className="mt-1 text-xl font-bold">{prefs.waterGoalMl || 'Set your'} ml daily goal</h2><Button className="mt-5" variant="secondary" onClick={() => navigate('/dashboard', { state: { tab: 'water' } })}>Open Water</Button></Card><Card><p className="text-sm text-accent">Fasting routine</p><h2 className="mt-1 text-xl font-bold">Track a mindful fasting window</h2><Button className="mt-5" variant="secondary" onClick={() => navigate('/dashboard', { state: { tab: 'fasting' } })}>Open Fasting</Button></Card>{plan.explanation && <Card className="md:col-span-2"><h2 className="font-semibold">Practical tip</h2><p className="mt-2 text-sm leading-6 text-muted">{typeof plan.explanation === 'string' ? plan.explanation : plan.explanation.practical_tip || 'Keep meals practical and consistent.'}</p></Card>}<Card className="md:col-span-2 border-accent/20 bg-accent/5"><p className="text-sm leading-6 text-muted"><strong className="text-ink">AI nutrition disclaimer:</strong> SmartDiet AI provides general nutrition guidance, not a diagnosis or substitute for medical advice. Keep your doctor’s guidance first.</p></Card></div>}
    </>}
    <FoodDetail item={detail || {}} open={Boolean(detail)} onClose={() => setDetail(null)} />
  </Page>
}
