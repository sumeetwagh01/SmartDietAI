import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Apple, Check, ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Leaf, PersonStanding, Scale, ShieldCheck, Sparkles, UserRound, Waves } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMe, updateMe } from '@/api/auth'
import { generateAiPlan, generateTargets } from '@/api/aiPlan'
import NumberStepper from '@/components/onboarding/NumberStepper'
import RangeField from '@/components/onboarding/RangeField'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import useAuthStore from '@/store/authStore'
import useAiPlanStore from '@/store/aiPlanStore'
import useOnboardingStore from '@/store/onboardingStore'
import usePrefsStore from '@/store/prefsStore'
import { getApiError, isValidationError } from '@/utils/apiError'
import { toIsoDate } from '@/utils/dates'
import { normalizeAiPlan, normalizeAiTargets } from '@/lib/normalizeAiPlan'
import estimateNutrition from '@/utils/nutritionEstimate'

const introCards = [
  { icon: Apple, title: 'Personalized for Indian food', text: 'Plans built around familiar foods, your goal and daily routine.' },
  { icon: ShieldCheck, title: 'Clinically filtered', text: 'Saved conditions, allergies and diet choices stay active as safety filters.' },
  { icon: Sparkles, title: 'Explains every choice', text: 'Understand why each meal fits instead of following a black box.' },
]

const activities = [
  ['sedentary', 'Sedentary', 'Mostly seated; little planned exercise', PersonStanding],
  ['light', 'Light', 'Walking or light exercise 1–3 days/week', Waves],
  ['moderate', 'Moderate', 'Exercise or sport 3–5 days/week', Activity],
  ['active', 'Active', 'Hard exercise 6–7 days/week', Dumbbell],
  ['very_active', 'Very active', 'Physical work or intense daily training', HeartPulse],
]

const goals = [
  ['weight_loss', 'Weight loss', 'Create a sustainable calorie deficit'],
  ['maintenance', 'Maintenance', 'Keep your weight and build consistency'],
  ['muscle_gain', 'Muscle gain', 'Prioritize protein and training fuel'],
  ['weight_gain', 'Weight gain', 'Add energy with balanced meals'],
]

const conditionEffects = {
  diabetes: 'avoids high glycaemic-index foods',
  hypertension: 'limits sodium',
  lactose_intolerance: 'excludes dairy',
  gluten_intolerance: 'excludes gluten foods',
  kidney_disease: 'limits sodium',
  heart_disease: 'limits high-fat foods',
  pcos: 'favours low-GI foods',
  hypothyroid: 'targets higher fibre',
}

const allergenLabels = { dairy: 'Dairy', gluten: 'Gluten', nuts: 'Nuts', eggs: 'Eggs', fish: 'Fish', legumes: 'Legumes' }
const fastingOptions = [['none', 'None'], ['12:12', '12:12'], ['14:10', '14:10'], ['16:8', '16:8']]
const stages = ['Reading your profile…', 'Calculating your targets…', 'Planning your meals…', 'Running safety checks…']
const cuisineRegions = ['north_indian', 'south_indian', 'gujarati', 'maharashtrian', 'bengali', 'punjabi', 'rajasthani', 'east_indian', 'other']

const kgToLb = (kg) => Number(kg) * 2.20462
const lbToKg = (lb) => Number(lb) / 2.20462
const cmToIn = (cm) => Number(cm) / 2.54
const inToCm = (inches) => Number(inches) * 2.54
const round50 = (value) => Math.round(value / 50) * 50
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function SelectCard({ selected, title, description, icon: Icon, onClick }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-muted'}`}>{Icon ? <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? 'bg-accent text-accent-ink' : 'bg-surface text-muted'}`}><Icon size={21} /></span> : null}<span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span>{description ? <span className="mt-1 block text-sm text-muted">{description}</span> : null}</span>{selected ? <Check className="shrink-0 text-accent" size={20} /> : null}</button>
}

function Chip({ selected, children, onClick }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${selected ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface-2 text-ink hover:border-muted'}`}>{children}</button>
}

function UnitToggle({ options, value, onChange, label }) {
  return <div className="inline-flex rounded-full border border-line bg-surface-2 p-1" aria-label={label}>{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`min-h-9 rounded-full px-3 text-xs font-semibold ${value === option ? 'bg-accent text-accent-ink' : 'text-muted'}`}>{option}</button>)}</div>
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, token, setAuth } = useAuthStore()
  const { step, draft, setStep, setDraft, clearDraft } = useOnboardingStore()
  const prefs = usePrefsStore()
  const setAiTargets = useAiPlanStore((state) => state.setTargets)
  const setAiPlan = useAiPlanStore((state) => state.setPlan)
  const [introIndex, setIntroIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [heightUnit, setHeightUnit] = useState('cm')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [submitState, setSubmitState] = useState('idle')
  const [stageIndex, setStageIndex] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [validationFailure, setValidationFailure] = useState(false)
  const [errorPhase, setErrorPhase] = useState('plan')
  const [submittedProfile, setSubmittedProfile] = useState(null)
  const [dislikedInput, setDislikedInput] = useState('')

  useEffect(() => {
    if ((!draft.name && user?.name) || !draft.age) Promise.resolve().then(() => setDraft({ ...draft, name: draft.name || user?.name || '', age: draft.age || 18 }))
  }, [draft, setDraft, user?.name])

  useEffect(() => {
    if (submitState !== 'generating') return undefined
    const timer = window.setInterval(() => setStageIndex((index) => (index + 1) % stages.length), 1800)
    return () => window.clearInterval(timer)
  }, [submitState])

  const update = (key, value) => setDraft({ ...draft, [key]: value })
  const goTo = (next) => {
    if (next === 2 && (!draft.height_cm || !draft.weight_kg)) setDraft({ ...draft, height_cm: draft.height_cm || 165, weight_kg: draft.weight_kg || 60 })
    setDirection(next >= step ? 1 : -1); setStep(Math.max(0, Math.min(10, next))); setSubmitError('')
  }
  const toggleCondition = (condition) => update('medical_conditions', draft.medical_conditions.includes(condition) ? draft.medical_conditions.filter((item) => item !== condition) : [...draft.medical_conditions, condition])
  const toggleAllergen = (allergen) => update('allergens', draft.allergens.includes(allergen) ? draft.allergens.filter((item) => item !== allergen) : [...draft.allergens, allergen])
  const bmi = draft.weight_kg && draft.height_cm ? Number(draft.weight_kg) / ((Number(draft.height_cm) / 100) ** 2) : 0
  const bmiLabel = bmi < 18.5 ? 'Underweight range' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight range' : 'Higher BMI range'
  const fastingRestricted = draft.medical_conditions.some((item) => ['diabetes', 'kidney_disease', 'heart_disease'].includes(item)) || Number(draft.age) < 18
  const waterGoal = prefs.waterGoalMl || round50(35 * (Number(draft.weight_kg) || 60))
  const estimate = useMemo(() => estimateNutrition(draft), [draft])
  const aiPreferences = prefs.aiPreferences || {}
  const setAiPreferences = (changes) => prefs.setAiPreferences({ ...aiPreferences, ...changes })
  const toggleCuisine = (region) => {
    const current = aiPreferences.cuisine_regions || []
    if (current.includes(region)) setAiPreferences({ cuisine_regions: current.filter((item) => item !== region) })
    else if (current.length < 4) setAiPreferences({ cuisine_regions: [...current, region] })
  }
  const addDisliked = () => {
    const value = dislikedInput.replace(/[^A-Za-z0-9 -]/g, '').trim().slice(0, 40)
    const current = aiPreferences.disliked_foods || []
    if (value && current.length < 10 && !current.some((item) => item.toLowerCase() === value.toLowerCase())) setAiPreferences({ disliked_foods: [...current, value] })
    setDislikedInput('')
  }

  const canContinue = () => {
    if (step === 1) return draft.name.trim() && Number(draft.age) >= 14 && Number(draft.age) <= 100 && ['male', 'female'].includes(draft.gender)
    if (step === 2) return Number(draft.height_cm) >= 120 && Number(draft.weight_kg) >= 30
    return true
  }

  const next = () => {
    if (!canContinue()) { setSubmitError('Complete the required fields before continuing.'); return }
    if (step === 8) {
      const fasting = fastingRestricted ? 'none' : prefs.fastingPreference
      prefs.setRoutine({ waterGoalMl: waterGoal, fastingPreference: fasting })
      setAiPreferences({ target_weight_kg: prefs.targetWeightKg, fasting })
    }
    goTo(step + 1)
  }

  const profilePayload = () => ({
    name: draft.name.trim(), age: Number(draft.age), gender: draft.gender,
    weight_kg: Number(Number(draft.weight_kg).toFixed(1)), height_cm: Number(Number(draft.height_cm).toFixed(1)),
    activity_level: draft.activity_level, goal: draft.goal,
    medical_conditions: draft.medical_conditions, allergens: draft.allergens,
    is_vegetarian: Boolean(draft.is_vegetarian), is_vegan: Boolean(draft.is_vegan),
  })

  const buildPlan = async () => {
    setSubmitState('generating'); setStageIndex(0); setSubmitError(''); setValidationFailure(false)
    try {
      const date = toIsoDate(new Date())
      const preferences = usePrefsStore.getState().aiPreferences
      const targets = normalizeAiTargets(await generateTargets({ preferences, force: true }))
      setAiTargets(targets, false)
      const plan = normalizeAiPlan(await generateAiPlan({ date, preferences, regenerate: true }))
      setAiPlan(date, plan)
      if (!prefs.programStartDate) prefs.setProgramStartDate(date)
      navigate('/dashboard', { replace: true, state: { celebrate: true } })
    } catch (error) {
      setSubmitError(getApiError(error, 'Unable to build your meal plan. Please try again.'))
      setValidationFailure(isValidationError(error))
      setErrorPhase('plan')
      setSubmitState('error')
    }
  }

  const submit = async () => {
    if (submitState === 'saving' || submitState === 'generating') return
    const payload = profilePayload()
    setSubmittedProfile(payload); setSubmitState('saving'); setSubmitError(''); setValidationFailure(false); setErrorPhase('profile')
    try {
      await updateMe(payload)
      const refreshed = await getMe()
      setAuth(refreshed, token)
      clearDraft()
      await buildPlan()
    } catch (error) {
      setSubmitError(getApiError(error, 'Unable to save your profile. Please try again.'))
      setValidationFailure(isValidationError(error))
      setSubmitState('error')
    }
  }

  const reviewProfile = () => {
    if (submittedProfile) setDraft(submittedProfile)
    setSubmitState('idle'); setStep(6); setDirection(-1)
  }

  const handleSubmit = (event) => { event.preventDefault(); if (step === 0) goTo(1); else if (step < 10) next(); else submit() }

  if (submitState === 'saving' || submitState === 'generating' || submitState === 'error') return <div className="fixed inset-0 z-50 grid place-items-center bg-canvas p-5"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center">{submitState !== 'error' ? <><motion.div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-ink" animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Sparkles size={34} /></motion.div><h1 className="mt-7 text-3xl font-bold">Building your SmartDiet</h1><p className="mt-3 text-lg text-accent">{submitState === 'saving' ? 'Saving your health profile…' : stages[stageIndex]}</p><p className="mt-2 text-sm text-muted">Waking up the SmartDiet server…</p><div className="mx-auto mt-7 h-2 max-w-xs overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full bg-accent" initial={{ width: '12%' }} animate={{ width: submitState === 'saving' ? '30%' : `${50 + (stageIndex * 12)}%` }} /></div></> : <Card><h1 className="text-2xl font-bold">We couldn’t finish your plan</h1><p className="mt-3 text-sm leading-6 text-error" role="alert">{submitError}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">{validationFailure ? <Button onClick={reviewProfile}>Review my profile</Button> : <><Button onClick={errorPhase === 'plan' ? buildPlan : submit}>Retry</Button><Button variant="secondary" onClick={reviewProfile}>Review my profile</Button></>}</div></Card>}</motion.div></div>

  const stepContent = [
    <div key="welcome" className="text-center"><p className="text-sm font-semibold text-accent">Welcome to SmartDiet AI</p><h1 className="mt-2 text-4xl font-bold sm:text-5xl">A healthier routine,<br />made for you.</h1><div className="mx-auto mt-8 max-w-md overflow-hidden"><AnimatePresence mode="wait" initial={false}><motion.div key={introIndex} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -60) setIntroIndex((index) => Math.min(2, index + 1)); if (info.offset.x > 60) setIntroIndex((index) => Math.max(0, index - 1)) }} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="rounded-card border border-line bg-surface-2 p-7"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-ink">{(() => { const Icon = introCards[introIndex].icon; return <Icon /> })()}</span><h2 className="mt-5 text-xl font-semibold">{introCards[introIndex].title}</h2><p className="mt-2 text-sm leading-6 text-muted">{introCards[introIndex].text}</p></motion.div></AnimatePresence><div className="mt-4 flex justify-center gap-2">{introCards.map((card, index) => <button key={card.title} type="button" aria-label={`Show ${card.title}`} onClick={() => setIntroIndex(index)} className={`h-2.5 rounded-full transition-all ${index === introIndex ? 'w-8 bg-accent' : 'w-2.5 bg-muted/40'}`} />)}</div></div></div>,
    <div key="about"><StepHeading eyebrow="The essentials" title="Tell us about you" text="We use these details to estimate your daily needs." /><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium">Name</span><input autoFocus aria-label="Name" required value={draft.name} onChange={(event) => update('name', event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 outline-none" placeholder="Your name" /></label><NumberStepper label="Age" value={draft.age || 18} min={14} max={100} onChange={(value) => update('age', value)} /><div><span className="mb-2 block text-sm font-medium">Gender</span><div className="grid grid-cols-2 gap-2">{['male', 'female'].map((gender) => <SelectCard key={gender} selected={draft.gender === gender} title={titleCase(gender)} icon={UserRound} onClick={() => update('gender', gender)} />)}</div></div></div></div>,
    <div key="body"><StepHeading eyebrow="Your body" title="Height and weight" text="Switch units anytime; we securely save centimetres and kilograms." /><div className="mt-7 space-y-4"><div className="flex justify-end"><UnitToggle label="Height unit" options={['cm', 'ft/in']} value={heightUnit} onChange={setHeightUnit} /></div>{heightUnit === 'cm' ? <RangeField label="Height" value={Math.round(Number(draft.height_cm) || 165)} min={120} max={220} suffix="cm" onChange={(value) => update('height_cm', value)} /> : <ImperialHeight cm={Number(draft.height_cm) || 165} onChange={(value) => update('height_cm', value)} />}<div className="flex justify-end"><UnitToggle label="Weight unit" options={['kg', 'lb']} value={weightUnit} onChange={setWeightUnit} /></div>{weightUnit === 'kg' ? <RangeField label="Weight" value={Number(draft.weight_kg) || 60} min={30} max={200} step={0.5} suffix="kg" onChange={(value) => update('weight_kg', value)} /> : <RangeField label="Weight" value={Math.round(kgToLb(Number(draft.weight_kg) || 60))} min={66} max={441} suffix="lb" onChange={(value) => update('weight_kg', Number(lbToKg(value).toFixed(1)))} />}{bmi ? <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4"><span className="text-sm text-muted">Body mass index</span><span className="rounded-full bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">{bmi.toFixed(1)} · {bmiLabel}</span></div> : null}</div></div>,
    <div key="activity"><StepHeading eyebrow="Daily movement" title="How active are you?" text="Choose the option that best reflects a usual week." /><div className="mt-7 grid gap-3 sm:grid-cols-2">{activities.map(([value, title, description, Icon]) => <SelectCard key={value} selected={draft.activity_level === value} title={title} description={description} icon={Icon} onClick={() => update('activity_level', value)} />)}</div></div>,
    <div key="goal"><StepHeading eyebrow="Your direction" title="What are you working toward?" text="Your goal changes the energy and macro balance of the plan." /><div className="mt-7 grid gap-3 sm:grid-cols-2">{goals.map(([value, title, description]) => <SelectCard key={value} selected={draft.goal === value} title={title} description={description} icon={Scale} onClick={() => update('goal', value)} />)}</div><div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">{prefs.targetWeightKg == null ? <button type="button" onClick={() => prefs.setTargetWeightKg(Number(draft.weight_kg) || 60)} className="min-h-11 text-sm font-semibold text-accent">+ Add an optional target weight</button> : <><div className="mb-3 flex items-center justify-between"><span className="font-medium">Target weight</span><button type="button" onClick={() => prefs.setTargetWeightKg(null)} className="min-h-11 text-sm text-muted">Remove</button></div><RangeField label="Target" value={prefs.targetWeightKg} min={30} max={200} step={0.5} suffix="kg" onChange={prefs.setTargetWeightKg} /><p className="mt-2 text-xs text-muted">Saved only in your local preferences.</p></>}</div></div>,
    <div key="diet"><StepHeading eyebrow="Food preferences" title="Choose your diet type" text="We’ll keep every meal within this preference." /><div className="mt-7 grid gap-3">{[['vegetarian', 'Vegetarian', 'No meat or fish', Leaf], ['vegan', 'Vegan', 'No animal-derived foods', Leaf], ['non_vegetarian', 'Non-vegetarian', 'Includes vegetarian and non-vegetarian foods', Apple]].map(([value, title, description, Icon]) => { const selected = value === 'vegan' ? draft.is_vegan : value === 'vegetarian' ? draft.is_vegetarian && !draft.is_vegan : !draft.is_vegetarian && !draft.is_vegan; return <SelectCard key={value} selected={selected} title={title} description={description} icon={Icon} onClick={() => { if (value === 'vegan') setDraft({ ...draft, is_vegan: true, is_vegetarian: true }); else if (value === 'vegetarian') setDraft({ ...draft, is_vegan: false, is_vegetarian: true }); else setDraft({ ...draft, is_vegan: false, is_vegetarian: false }) }} /> })}</div></div>,
    <div key="health"><StepHeading eyebrow="Safety filters" title="Health conditions" text="Select every condition that applies." /><div className="mt-7 flex flex-wrap gap-2"><Chip selected={!draft.medical_conditions.length} onClick={() => update('medical_conditions', [])}>None</Chip>{Object.keys(conditionEffects).map((condition) => <Chip key={condition} selected={draft.medical_conditions.includes(condition)} onClick={() => toggleCondition(condition)}>{titleCase(condition)}</Chip>)}</div>{draft.medical_conditions.length ? <div className="mt-5 space-y-2 rounded-2xl bg-surface-2 p-4">{draft.medical_conditions.map((condition) => <p key={condition} className="text-sm"><span className="font-semibold">{titleCase(condition)}:</span> <span className="text-muted">{conditionEffects[condition]}</span></p>)}</div> : null}<p className="mt-5 rounded-2xl border border-line p-4 text-sm text-muted">This is not medical advice; keep your doctor&apos;s guidance first.</p></div>,
    <div key="allergies"><StepHeading eyebrow="Ingredient safety" title="Any food allergies?" text="Only canonical allergy filters supported by SmartDiet are shown." /><div className="mt-7 flex flex-wrap gap-2"><Chip selected={!draft.allergens.length} onClick={() => update('allergens', [])}>None</Chip>{Object.entries(allergenLabels).map(([value, label]) => <Chip key={value} selected={draft.allergens.includes(value)} onClick={() => toggleAllergen(value)}>{label}</Chip>)}</div><p className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm text-muted">Peanut and tree-nut allergies are covered by <strong className="text-ink">Nuts</strong>. Free-text allergens are not accepted.</p></div>,
    <div key="routine"><StepHeading eyebrow="Local preferences" title="Your routine" text="These settings stay on this device and are never sent to the backend." /><div className="mt-7 space-y-5"><RangeField label="Daily water goal" value={waterGoal} min={1000} max={5000} step={50} suffix="ml" onChange={(value) => prefs.setRoutine({ waterGoalMl: value })} /><div><p className="mb-3 font-medium">Fasting interest</p>{fastingRestricted ? <div className="rounded-2xl border border-carbs/30 bg-carbs/10 p-4 text-sm text-carbs">Talk to your doctor before fasting. Fasting options are hidden for your current profile.</div> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{fastingOptions.map(([value, label]) => <Chip key={value} selected={prefs.fastingPreference === value} onClick={() => prefs.setRoutine({ fastingPreference: value })}>{label}</Chip>)}</div>}</div><label className="flex min-h-14 items-center justify-between rounded-2xl border border-line bg-surface-2 px-4"><span><span className="block font-medium">Gentle reminders</span><span className="text-sm text-muted">Remember meals and hydration</span></span><input type="checkbox" checked={prefs.remindersEnabled} onChange={(event) => prefs.setRoutine({ remindersEnabled: event.target.checked })} className="h-5 w-5 accent-accent" /></label></div></div>,
    <div key="food-preferences"><StepHeading eyebrow="Make it practical" title="Food preferences" text="Gemini uses these preferences while your health, allergy and diet filters remain mandatory." /><div className="mt-7 space-y-6"><fieldset><legend className="mb-3 font-medium">Cuisine regions <span className="text-xs text-muted">(choose up to 4)</span></legend><div className="flex flex-wrap gap-2">{cuisineRegions.map((region) => <Chip key={region} selected={(aiPreferences.cuisine_regions || []).includes(region)} onClick={() => toggleCuisine(region)}>{titleCase(region)}</Chip>)}</div></fieldset><fieldset><legend className="mb-3 font-medium">Meals per day</legend><div className="grid grid-cols-3 gap-2">{[3, 4, 5].map((count) => <Chip key={count} selected={(aiPreferences.meals_per_day || 4) === count} onClick={() => setAiPreferences({ meals_per_day: count })}>{count}</Chip>)}</div></fieldset>{[['Spice level', 'spice_level', ['mild', 'medium', 'hot']], ['Cooking time', 'cooking_time', ['quick', 'normal', 'any']], ['Budget', 'budget', ['low', 'medium', 'any']]].map(([label, key, values]) => <fieldset key={key}><legend className="mb-3 font-medium">{label}</legend><div className="flex flex-wrap gap-2">{values.map((value) => <Chip key={value} selected={(aiPreferences[key] || (key === 'spice_level' ? 'medium' : 'any')) === value} onClick={() => setAiPreferences({ [key]: value })}>{titleCase(value)}</Chip>)}</div></fieldset>)}<fieldset><legend className="mb-3 font-medium">Foods you dislike</legend><div className="flex gap-2"><input value={dislikedInput} maxLength={40} onChange={(event) => setDislikedInput(event.target.value.replace(/[^A-Za-z0-9 -]/g, ''))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addDisliked() } }} className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-surface-2 px-4" placeholder="Type a food and press Enter" /><Button type="button" variant="secondary" disabled={!dislikedInput.trim() || (aiPreferences.disliked_foods || []).length >= 10} onClick={addDisliked}>Add</Button></div><div className="mt-3 flex flex-wrap gap-2">{(aiPreferences.disliked_foods || []).map((item) => <button key={item} type="button" onClick={() => setAiPreferences({ disliked_foods: aiPreferences.disliked_foods.filter((value) => value !== item) })} className="min-h-11 rounded-full border border-line bg-surface-2 px-4 text-sm">{item} ×</button>)}</div></fieldset></div></div>,
    <div key="review"><StepHeading eyebrow="Ready when you are" title="Review your profile" text="You can jump back and edit any section before saving." /><div className="mt-7 grid gap-3 sm:grid-cols-2"><SummaryCard title="About you" value={`${draft.name}, ${draft.age} · ${titleCase(draft.gender)}`} step={1} edit={goTo} /><SummaryCard title="Body" value={`${Number(draft.height_cm).toFixed(0)} cm · ${Number(draft.weight_kg).toFixed(1)} kg`} step={2} edit={goTo} /><SummaryCard title="Activity" value={titleCase(draft.activity_level)} step={3} edit={goTo} /><SummaryCard title="Goal" value={titleCase(draft.goal)} step={4} edit={goTo} /><SummaryCard title="Diet" value={draft.is_vegan ? 'Vegan' : draft.is_vegetarian ? 'Vegetarian' : 'Non-vegetarian'} step={5} edit={goTo} /><SummaryCard title="Safety filters" value={[...draft.medical_conditions, ...draft.allergens].map(titleCase).join(', ') || 'None'} step={6} edit={goTo} /><SummaryCard title="Food preferences" value={`${(aiPreferences.cuisine_regions || []).map(titleCase).join(', ') || 'Any Indian region'} · ${aiPreferences.meals_per_day || 4} meals · ${titleCase(aiPreferences.spice_level || 'medium')}`} step={9} edit={goTo} /></div><Card className="mt-5 border-accent/30 bg-accent/10"><p className="text-sm font-semibold text-accent">Your estimated daily target</p><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">{[['Calories', estimate.calories, 'kcal'], ['Protein', estimate.protein, 'g'], ['Carbs', estimate.carbs, 'g'], ['Fat', estimate.fat, 'g']].map(([label, value, unit]) => <div key={label}><p className="text-xs text-muted">{label}</p><motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-2xl font-bold">{value}<span className="ml-1 text-xs font-normal text-muted">{unit}</span></motion.p></div>)}</div><p className="mt-4 text-xs text-muted">Estimate — your exact targets and plan are calculated by Gemini and validated by the server.</p></Card></div>,
  ]

  return <div className="mx-auto max-w-3xl py-2 sm:py-8"><form onSubmit={handleSubmit}><div className="mb-5 flex items-center justify-between">{step > 0 ? <button type="button" onClick={() => goTo(step - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-muted hover:bg-surface-2"><ChevronLeft size={18} />Back</button> : <span />}{step > 0 ? <div className="text-right"><p className="text-xs font-semibold text-muted">Step {step} of 10</p><div className="mt-2 flex gap-1.5" aria-label={`Step ${step} of 10`}>{Array.from({ length: 10 }, (_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index + 1 === step ? 'w-6 bg-accent' : index + 1 < step ? 'w-2 bg-accent/60' : 'w-2 bg-muted/30'}`} />)}</div></div> : null}</div><Card className="min-h-[520px] overflow-hidden p-6 sm:p-9"><AnimatePresence mode="wait" initial={false} custom={direction}><motion.section key={step} custom={direction} initial={{ opacity: 0, x: direction * 45 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -45 }} transition={{ duration: 0.22 }} drag={step !== 2 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x > 90 && step > 0) goTo(step - 1); if (info.offset.x < -90 && step > 0 && step < 10 && canContinue()) next() }}>{stepContent[step]}</motion.section></AnimatePresence>{submitError ? <p className="mt-5 text-sm text-error" role="alert">{submitError}</p> : null}<div className="mt-8 flex justify-end">{step === 0 ? <Button type="submit" size="lg">Get started <ChevronRight size={18} /></Button> : step < 10 ? <Button type="submit" disabled={!canContinue()}>Next <ChevronRight size={18} /></Button> : <Button type="submit" size="lg" loading={submitState === 'saving'}>Save and build my plan <Sparkles size={18} /></Button>}</div></Card></form></div>
}

function StepHeading({ eyebrow, title, text }) {
  const description = text === 'These settings stay on this device and are never sent to the backend.'
    ? 'Water and reminders stay on this device. Target weight and fasting preference help personalize your AI plan.'
    : text
  return <header><p className="text-sm font-semibold text-accent">{eyebrow}</p><h1 className="mt-1 text-3xl font-bold">{title}</h1><p className="mt-2 text-muted">{description}</p></header>
}

function ImperialHeight({ cm, onChange }) {
  const totalInches = Math.round(cmToIn(cm))
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  const setHeight = (nextFeet, nextInches) => onChange(Number(inToCm((Number(nextFeet) * 12) + Number(nextInches)).toFixed(1)))
  return <div className="rounded-2xl border border-line bg-surface-2 p-4"><div className="mb-4 flex items-end justify-between gap-3"><span className="font-medium">Height</span><div className="flex gap-2"><label className="text-xs text-muted">Feet<input aria-label="Height feet" type="number" min="4" max="7" value={feet} onChange={(event) => setHeight(event.target.value, inches)} className="ml-1 min-h-11 w-14 rounded-xl border border-line bg-surface text-center text-base font-bold text-ink" /></label><label className="text-xs text-muted">Inches<input aria-label="Height inches" type="number" min="0" max="11" value={inches} onChange={(event) => setHeight(feet, event.target.value)} className="ml-1 min-h-11 w-14 rounded-xl border border-line bg-surface text-center text-base font-bold text-ink" /></label></div></div><input aria-label="Height in inches" type="range" min="48" max="87" value={totalInches} onChange={(event) => onChange(Number(inToCm(event.target.value).toFixed(1)))} className="h-2 w-full accent-accent" /></div>
}

function SummaryCard({ title, value, step, edit }) {
  return <div className="rounded-2xl border border-line bg-surface-2 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted">{title}</p><p className="mt-1 text-sm font-semibold">{value}</p></div><button type="button" onClick={() => edit(step)} className="min-h-11 rounded-full px-3 text-xs font-semibold text-accent">Edit</button></div></div>
}
