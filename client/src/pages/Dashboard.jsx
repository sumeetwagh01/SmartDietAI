import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getSuggestions } from '@/api/ai'
import { generateAiPlan, generateTargets, getTargets, getTodayAiPlan } from '@/api/aiPlan'
import { appendFoodEntries, deleteEntry, getFoodLog } from '@/api/foodLog'
import { addWeight, getProgress, getWeightHistory } from '@/api/progress'
import FastingTab from '@/components/dashboard/FastingTab'
import MealSheet from '@/components/dashboard/MealSheet'
import OverallTab from '@/components/dashboard/OverallTab'
import WaterTab from '@/components/dashboard/WaterTab'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DateSwitcher from '@/components/ui/DateSwitcher'
import Input from '@/components/ui/Input'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import ThemeToggle from '@/components/ui/ThemeToggle'
import useApi from '@/hooks/useApi'
import useAuthStore from '@/store/authStore'
import useAiPlanStore from '@/store/aiPlanStore'
import useOnboardingStore from '@/store/onboardingStore'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { lastDates, toIsoDate } from '@/utils/dates'
import { mealSlots } from '@/utils/food'
import { getApiError, isValidationError } from '@/utils/apiError'
import { normalizeAiPlan, normalizeAiTargets } from '@/lib/normalizeAiPlan'

const today = toIsoDate(new Date())
const stages = ['Reading your profile…', 'Calculating your targets…', 'Planning your meals…', 'Running safety checks…']
const normalizeMeal = (value) => value === 'snacks' ? 'snack' : mealSlots.includes(value) ? value : 'breakfast'
const profileIsComplete = (user) => Boolean(user?.name && user?.age && user?.gender && user?.weight_kg && user?.height_cm && user?.activity_level && user?.goal)
let targetsInFlight = null

const loadAiTargets = async () => {
  const result = await getTargets()
  if (result?.targets) return { targets: normalizeAiTargets(result.targets), stale: Boolean(result.stale || useAiPlanStore.getState().stale) }
  if (!targetsInFlight) {
    const preferences = usePrefsStore.getState().aiPreferences
    targetsInFlight = generateTargets({ preferences }).finally(() => { targetsInFlight = null })
  }
  return { targets: normalizeAiTargets(await targetsInFlight), stale: false }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const user = useAuthStore((state) => state.user)
  const [date, setDate] = useState(today)
  const [tab, setTab] = useState(['overall', 'water', 'fasting'].includes(location.state?.tab) ? location.state.tab : 'overall')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [weightSheet, setWeightSheet] = useState(false)
  const [weight, setWeight] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [celebrate, setCelebrate] = useState(Boolean(location.state?.celebrate))
  const [generateState, setGenerateState] = useState('idle')
  const [generateError, setGenerateError] = useState('')
  const [generateValidation, setGenerateValidation] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const prefs = usePrefsStore()
  const cachedTargets = useAiPlanStore((state) => state.targets)
  const setAiTargets = useAiPlanStore((state) => state.setTargets)
  const aiStore = { setTargets: setAiTargets }
  const setAiPlan = useAiPlanStore((state) => state.setPlan)
  const wellness = useWellnessStore()
  const setMealAssignments = wellness.setMealAssignments
  const showToast = useToastStore((state) => state.show)
  const setOnboardingStep = useOnboardingStore((state) => state.setStep)
  const setOnboardingDraft = useOnboardingStore((state) => state.setDraft)

  const query = useApi(async () => {
    const week = lastDates(date)
    const [log, progress, weights, planPayload] = await Promise.all([
      getFoodLog(date), getProgress(week[0], week[week.length - 1]), getWeightHistory(), getTodayAiPlan(date),
    ])
    const plan = normalizeAiPlan(planPayload)
    return { log: log || { entries: [] }, plan, weekly: Array.isArray(progress) ? progress : [], weights: Array.isArray(weights) ? weights : [] }
  }, { immediate: false, errorMessage: 'Unable to load your Home dashboard.' })
  const targetsQuery = useApi(loadAiTargets, { errorMessage: 'Unable to calculate your AI nutrition targets.' })
  const suggestions = useApi(getSuggestions, { errorMessage: 'Tip unavailable.' })
  const { execute } = query

  const load = useCallback(async () => {
    const data = await execute()
    const entries = data.log?.entries || []
    const stored = useWellnessStore.getState().mealAssignments[date] || []
    const fallback = normalizeMeal(data.log?.meal_type)
    setMealAssignments(date, entries.map((_, index) => stored[index] || fallback))
    return data
  }, [date, execute, setMealAssignments])
  useEffect(() => { Promise.resolve().then(() => load().catch(() => {})) }, [load])
  useEffect(() => {
    if (targetsQuery.data?.targets) setAiTargets(targetsQuery.data.targets, targetsQuery.data.stale)
  }, [setAiTargets, targetsQuery.data])

  useEffect(() => {
    if (query.data?.plan && date === today && !prefs.programStartDate) prefs.setProgramStartDate(today)
  }, [date, prefs, query.data?.plan])
  useEffect(() => {
    if (!celebrate) return undefined
    const timer = window.setTimeout(() => { setCelebrate(false); navigate('/dashboard', { replace: true, state: {} }) }, 2200)
    return () => window.clearTimeout(timer)
  }, [celebrate, navigate])
  useEffect(() => {
    if (generateState !== 'generating') return undefined
    const timer = window.setInterval(() => setStageIndex((index) => (index + 1) % stages.length), 1700)
    return () => window.clearInterval(timer)
  }, [generateState])

  const entries = query.data?.log?.entries || []
  const assignments = entries.map((_, index) => wellness.mealAssignments[date]?.[index] || normalizeMeal(query.data?.log?.meal_type))
  const targets = targetsQuery.data?.targets || cachedTargets
  const target = targets?.calories || 0
  const startDate = prefs.programStartDate
  const cycleDay = startDate ? Math.min(28, Math.max(1, Math.floor((new Date(`${today}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000) + 1)) : 1

  const updateLog = (result, nextAssignments) => {
    query.setData({ ...query.data, log: result })
    wellness.setMealAssignments(date, nextAssignments)
  }
  const addToMeal = async (meal, entry) => {
    try {
      const result = await appendFoodEntries({ date, meal_type: meal, entries: [entry] })
      const currentAssignments = useWellnessStore.getState().mealAssignments[date] || []
      const preserved = result.entries.slice(0, -1).map((_, index) => currentAssignments[index] || assignments[index] || normalizeMeal(result.meal_type))
      updateLog(result, [...preserved, meal])
      showToast(`${entry.food_name} logged.`)
    } catch (error) { showToast(getApiError(error, 'Unable to log food.'), 'error'); throw error }
  }
  const deleteFromMeal = async (index) => {
    try {
      const result = await deleteEntry(date, index)
      const currentAssignments = useWellnessStore.getState().mealAssignments[date] || assignments
      updateLog(result, currentAssignments.filter((_, itemIndex) => itemIndex !== index))
      showToast('Food removed.')
    } catch (error) { showToast(getApiError(error, 'Unable to remove food.'), 'error'); throw error }
  }
  const plannedEntry = (item) => ({ food_name: item.food_name, quantity: Number(item.quantity) || 1, unit: item.unit || 'serving', calories: Number(item.calories) || 0, protein: Number(item.protein_g ?? item.protein) || 0, carbs: Number(item.carbs_g ?? item.carbs) || 0, fat: Number(item.fat_g ?? item.fat) || 0, fibre: Number(item.fibre_g ?? item.fibre) || 0, sodium: Number(item.sodium_mg ?? item.sodium) || 0 })

  const createPlan = async () => {
    if (generateState === 'generating') return
    setGenerateState('generating'); setGenerateError(''); setGenerateValidation(false); setStageIndex(0)
    try {
      const result = normalizeAiPlan(await generateAiPlan({ date: today, preferences: prefs.aiPreferences, regenerate: Boolean(query.data?.plan) }))
      query.setData({ ...query.data, plan: result })
      setAiPlan(today, result)
      if (!prefs.programStartDate) prefs.setProgramStartDate(today)
      setGenerateState('idle'); setCelebrate(true)
    } catch (error) {
      setGenerateError(getApiError(error, 'Unable to generate your meal plan.'))
      setGenerateValidation(isValidationError(error))
      setGenerateState('error')
    }
  }
  const reviewProfile = () => {
    setOnboardingDraft({ name: user?.name || '', age: user?.age || '', gender: user?.gender || 'male', weight_kg: user?.weight_kg || '', height_cm: user?.height_cm || '', activity_level: user?.activity_level || 'moderate', goal: user?.goal || 'maintenance', medical_conditions: user?.medical_conditions || [], allergens: user?.allergens || [], is_vegetarian: Boolean(user?.is_vegetarian), is_vegan: Boolean(user?.is_vegan) })
    setOnboardingStep(6); navigate('/onboarding')
  }
  const saveWeight = async (event) => {
    event.preventDefault(); if (!weight || savingWeight) return
    setSavingWeight(true)
    try { const saved = await addWeight(Number(weight), date); query.setData({ ...query.data, weights: [...query.data.weights, saved] }); setWeight(''); setWeightSheet(false); showToast('Weight logged.') }
    catch (error) { showToast(getApiError(error, 'Unable to log weight.'), 'error') }
    finally { setSavingWeight(false) }
  }

  if (query.loading || query.status === 'idle' || targetsQuery.loading) return <div><PageSkeleton /><p className="text-center text-sm text-accent">Calculating your targets with AI…</p></div>
  if (query.status === 'error') return <ErrorState message={query.error} onRetry={() => load().catch(() => {})} />
  if (targetsQuery.status === 'error') return <ErrorState message={targetsQuery.error} onRetry={() => targetsQuery.retry().catch(() => {})} />
  const latestWeightEntry = [...query.data.weights].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]
  const latestWeight = latestWeightEntry ? { ...latestWeightEntry, history: query.data.weights } : { history: query.data.weights }
  const suggestionText = suggestions.data?.tip || ''

  return <Page className="space-y-5">{targetsQuery.data?.stale ? <Card className="flex flex-wrap items-center justify-between gap-3 border-carbs/30 bg-carbs/10"><p className="text-sm font-semibold text-carbs">Your profile or preferences changed — Recalculate</p><Button size="sm" onClick={async () => { try { const next = normalizeAiTargets(await generateTargets({ preferences: prefs.aiPreferences, force: true })); targetsQuery.setData({ targets: next, stale: false }); aiStore.setTargets(next, false); showToast('AI targets recalculated.') } catch (error) { showToast(getApiError(error), 'error') } }}>Recalculate</Button></Card> : null}{celebrate ? <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-canvas/90 p-5 backdrop-blur"><div className="text-center"><motion.div animate={reduceMotion ? {} : { y: [0, -12, 0], rotate: [0, 8, -8, 0] }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-ink"><Sparkles size={34} /></motion.div><h2 className="mt-6 text-3xl font-bold">Your plan is ready!</h2></div></motion.div> : null}{generateState === 'generating' || generateState === 'error' ? <div className="fixed inset-0 z-50 grid place-items-center bg-canvas p-5"><div className="w-full max-w-md text-center">{generateState === 'generating' ? <><motion.div animate={reduceMotion ? {} : { rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-ink"><Sparkles size={32} /></motion.div><h2 className="mt-6 text-2xl font-bold">Building today’s plan</h2><p className="mt-3 text-accent">{stages[stageIndex]}</p><p className="mt-2 text-sm text-muted">Waking up the SmartDiet server…</p></> : <Card><h2 className="text-2xl font-bold">Plan generation stopped</h2><p className="mt-3 text-sm text-error">{generateError}</p><div className="mt-6 flex justify-center gap-2">{generateValidation ? <Button onClick={reviewProfile}>Review my profile</Button> : <Button onClick={createPlan}>Retry</Button>}<Button variant="secondary" onClick={() => setGenerateState('idle')}>Close</Button></div></Card>}</div></div> : null}
    <header><div className="flex items-center justify-between gap-3"><DateSwitcher value={date} onChange={setDate} /><ThemeToggle /></div><div className="mt-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold">Good day, {user?.name?.split(' ')[0] || 'there'}</h1><p className="mt-1 text-muted">Your nutrition, hydration and routine in one place.</p></div><span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">Day {cycleDay} of 28</span></div></header><div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-1" role="tablist">{[['overall', 'Overall'], ['water', 'Water'], ['fasting', 'Fasting']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`min-h-11 rounded-xl text-sm font-semibold ${tab === value ? 'bg-surface text-ink shadow-soft' : 'text-muted'}`}>{label}</button>)}</div>
    {tab === 'overall' ? <OverallTab date={date} entries={entries} assignments={assignments} plan={query.data.plan} target={target} aiTargets={targets} weekly={query.data.weekly} latestWeight={latestWeight} waterByDate={wellness.waterByDate} reportTiles={prefs.reportTiles} toggleReportTile={prefs.toggleReportTile} onOpenMeal={setSelectedMeal} onGenerate={createPlan} generating={generateState === 'generating'} generateError={generateError} profileComplete={profileIsComplete(user)} isToday={date === today} onReviewProfile={reviewProfile} onOpenWeight={() => setWeightSheet(true)} onAddWater={() => { wellness.addWater(date, 250); showToast('Added 250 ml water.') }} onLogFood={() => navigate('/food-log', { state: { date, meal: selectedMeal || 'breakfast' } })} suggestion={suggestionText} suggestionLoading={suggestions.loading} suggestionError={suggestions.error} retrySuggestion={() => suggestions.retry().catch(() => {})} onDateChange={setDate} /> : tab === 'water' ? <WaterTab date={date} /> : <FastingTab user={user} />}
    <MealSheet meal={selectedMeal} loggedEntries={entries.map((entry, index) => ({ entry, index })).filter(({ index }) => assignments[index] === selectedMeal)} plannedItems={query.data.plan?.meals?.[selectedMeal] || []} onClose={() => setSelectedMeal(null)} onDelete={deleteFromMeal} onAte={(item) => addToMeal(selectedMeal, plannedEntry(item))} onAddFood={() => navigate('/food-log', { state: { date, meal: selectedMeal } })} /><BottomSheet open={weightSheet} title="Add weight" onClose={() => setWeightSheet(false)}><form className="space-y-4" onSubmit={saveWeight}><Input label="Weight (kg)" type="number" min="1" step="0.1" required value={weight} onChange={(event) => setWeight(event.target.value)} /><Button type="submit" className="w-full" loading={savingWeight}>Save weight</Button></form></BottomSheet>
  </Page>
}
