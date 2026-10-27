import { ChevronRight, Clock3, ExternalLink, Grid2X2Check, Heart, Info, LogOut, RefreshCw, Settings2, Share2, SlidersHorizontal, Sparkles, Target, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getFoodLog } from '@/api/foodLog'
import { getFood } from '@/api/nutrition'
import ProfileEditSheet from '@/components/profile/ProfileEditSheet'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DateSwitcher from '@/components/ui/DateSwitcher'
import Input from '@/components/ui/Input'
import Page from '@/components/ui/Page'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/StateView'
import ThemeToggle from '@/components/ui/ThemeToggle'
import useApi from '@/hooks/useApi'
import useAiPlanStore from '@/store/aiPlanStore'
import useAuthStore from '@/store/authStore'
import useOnboardingStore from '@/store/onboardingStore'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { toIsoDate } from '@/utils/dates'
import { clearPerUserClientData } from '@/utils/session'

const today = toIsoDate(new Date())
const tileLabels = { weight: 'Weight', calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fibre: 'Fibre', water: 'Water' }
const menu = [
  ['all', 'All Meals', 'Saved meal-plan history', UtensilsCrossed],
  ['favourites', 'Favourite Meals', 'Foods saved on this device', Heart],
  ['plan', 'Diet Plan', 'Open your current plan', Sparkles],
  ['targets', "Today’s targets", 'Read-only nutrition targets', Target],
  ['foodprefs', 'Food preferences', 'Cuisine, meals, spice, time and budget', SlidersHorizontal],
  ['customize', 'Customize Home', 'Choose report tiles', Grid2X2Check],
  ['share', 'Share Food Timeline', 'Share a selected day summary', Share2],
  ['preferences', 'Preferences', 'Theme, units and local data', Settings2],
  ['about', 'About', 'SmartDiet AI information', Info],
]
const title = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const initials = (name) => String(name || 'SmartDiet member').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

export default function Profile() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const aiTargets = useAiPlanStore((state) => state.targets)
  const aiPlans = useAiPlanStore((state) => state.plans)
  const setAiStale = () => {
    useAiPlanStore.getState().clearAiData()
    useAiPlanStore.getState().setStale(true)
  }
  const prefs = usePrefsStore()
  const favouriteFoodIds = prefs.favouriteFoodIds
  const wellness = useWellnessStore()
  const clearDraft = useOnboardingStore((state) => state.clearDraft)
  const showToast = useToastStore((state) => state.show)
  const [active, setActive] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [safetyChanged, setSafetyChanged] = useState(false)
  const [shareDate, setShareDate] = useState(today)
  const [confirm, setConfirm] = useState(null)
  const [waterGoal, setWaterGoal] = useState(prefs.waterGoalMl || 2000)
  const overview = useApi(async () => {
    const favouriteFoods = await Promise.all(favouriteFoodIds.map((id) => getFood(id).catch(() => null)))
    return { favouriteFoods: favouriteFoods.filter(Boolean) }
  }, { errorMessage: 'Unable to load your account details.' })
  const logQuery = useApi(() => getFoodLog(shareDate), { immediate: false, errorMessage: 'Unable to load this food timeline.' })
  const { execute: loadLog } = logQuery
  useEffect(() => { if (active === 'share') Promise.resolve().then(() => loadLog().catch(() => {})) }, [active, loadLog, shareDate])
  const favourites = (overview.data?.favouriteFoods || []).filter((food) => favouriteFoodIds.includes(String(food.id)))
  const plans = useMemo(() => Object.values(aiPlans).filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date))), [aiPlans])
  const targets = useMemo(() => ({ calories: Number(aiTargets?.calories) || 0, protein: Number(aiTargets?.protein_g) || 0, carbs: Number(aiTargets?.carbs_g) || 0, fat: Number(aiTargets?.fat_g) || 0, fibre: Number(aiTargets?.fibre_g) || 0 }), [aiTargets])

  const selectMenu = (key) => { if (key === 'plan') navigate('/meal-plan'); else setActive((current) => current === key ? null : key) }
  const shareTimeline = async () => {
    const log = logQuery.data || {}
    const entries = log.entries || []
    const text = [`SmartDiet food timeline — ${shareDate}`, ...entries.map((entry) => `• ${entry.food_name}: ${Math.round(Number(entry.calories) || 0)} kcal`), `Total: ${Math.round(Number(log.total_calories) || 0)} kcal`].join('\n')
    try { if (navigator.share) await navigator.share({ title: 'SmartDiet food timeline', text }); else { await navigator.clipboard.writeText(text); showToast('Food timeline copied.') } }
    catch (error) { if (error?.name !== 'AbortError') showToast('Unable to share the timeline.', 'error') }
  }
  const performConfirmed = () => {
    if (confirm === 'restart') { prefs.setProgramStartDate(today); showToast('Your 28-day program restarted today.') }
    if (confirm === 'clear') { prefs.clearClientPreferences(); wellness.clearWellness(); clearDraft(); setWaterGoal(2000); showToast('Client-side data cleared.') }
    if (confirm === 'logout') { clearPerUserClientData(); clearAuth(); showToast("You've been logged out"); navigate('/login', { replace: true }) }
    setConfirm(null)
  }

  if (overview.loading) return <PageSkeleton />
  if (overview.status === 'error') return <ErrorState message={overview.error} onRetry={() => overview.retry().catch(() => {})} />
  const diet = user?.is_vegan ? 'Vegan' : user?.is_vegetarian ? 'Vegetarian' : 'Non-vegetarian'
  return <Page className="mx-auto max-w-3xl space-y-5"><header className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-accent text-xl font-bold text-accent-ink">{initials(user?.name)}</div><div className="min-w-0"><p className="text-sm text-accent">Your SmartDiet profile</p><h1 className="truncate text-2xl font-bold sm:text-3xl">{user?.name || 'SmartDiet member'}</h1><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{diet}</span><span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{title(user?.goal || 'Goal not set')}</span></div></div></div><Button variant="secondary" onClick={() => setEditOpen(true)}><SlidersHorizontal size={17} />Edit</Button></header>
    {safetyChanged ? <Card className="flex flex-wrap items-center justify-between gap-3 border-carbs/30 bg-carbs/10"><p className="text-sm font-medium text-carbs">Your nutrition inputs changed. Recalculate targets and regenerate your plan.</p><Button size="sm" onClick={() => navigate('/dashboard')}>Recalculate</Button></Card> : null}
    <Card className="overflow-hidden p-0">{menu.map(([key, label, description, Icon]) => <div key={key} className="border-b border-line last:border-0"><button type="button" onClick={() => selectMenu(key)} aria-expanded={active === key} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent"><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span><span className="block truncate text-xs text-muted">{description}</span></span><ChevronRight className={`shrink-0 text-muted transition ${active === key ? 'rotate-90' : ''}`} size={18} /></button>{active === key ? <div className="border-t border-line bg-surface-2/40 p-4">{key === 'all' ? <HistoryPanel plans={plans} /> : key === 'favourites' ? <FavouritesPanel foods={favourites} onRemove={prefs.toggleFavouriteFood} /> : key === 'targets' ? <TargetsPanel targets={targets} /> : key === 'foodprefs' ? <FoodPreferencesPanel value={prefs.aiPreferences} onSave={(value) => { prefs.setAiPreferences(value); setAiStale(true); setSafetyChanged(true); showToast('Food preferences saved.') }} /> : key === 'customize' ? <CustomizePanel selected={prefs.reportTiles} onToggle={prefs.toggleReportTile} /> : key === 'share' ? <div className="space-y-4"><DateSwitcher value={shareDate} onChange={setShareDate} />{logQuery.loading || logQuery.status === 'idle' ? <div className="skeleton h-28" /> : logQuery.status === 'error' ? <ErrorState message={logQuery.error} onRetry={() => logQuery.retry().catch(() => {})} /> : <><p className="text-sm text-muted">{(logQuery.data?.entries || []).length ? `${logQuery.data.entries.length} foods · ${Math.round(Number(logQuery.data.total_calories) || 0)} kcal` : 'No foods logged for this day.'}</p><Button variant="secondary" disabled={!(logQuery.data?.entries || []).length} onClick={shareTimeline}><Share2 size={17} />Share timeline</Button></>}</div> : key === 'preferences' ? <div className="space-y-5"><div className="flex items-center justify-between gap-3"><span><strong className="block">Theme</strong><span className="text-xs text-muted">Dark is the default</span></span><ThemeToggle /></div><label className="block"><span className="mb-2 block font-semibold">Units</span><select value={prefs.units} onChange={(event) => prefs.setUnits(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"><option value="metric">Metric (kg, cm)</option><option value="imperial">Imperial (lb, ft/in)</option></select></label><div><Input label="Daily water goal (ml)" type="number" min="500" max="6000" step="50" value={waterGoal} onChange={(event) => setWaterGoal(event.target.value)} /><Button size="sm" className="mt-2" onClick={() => { prefs.setRoutine({ waterGoalMl: Number(waterGoal) }); showToast('Water goal saved.') }}>Save water goal</Button></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setConfirm('restart')}><RefreshCw size={16} />Restart 28-day program</Button><Button variant="danger" onClick={() => setConfirm('clear')}>Clear client-side data</Button></div></div> : <AboutPanel />}</div> : null}</div>)}</Card>
    <Card><p className="text-sm text-muted">{user?.email}</p><Button className="mt-3" variant="danger" onClick={() => setConfirm('logout')}><LogOut size={17} />Logout</Button></Card>
    {editOpen ? <ProfileEditSheet open onClose={() => setEditOpen(false)} onProfileChange={() => { setAiStale(true); setSafetyChanged(true) }} /> : null}<ConfirmDialog open={Boolean(confirm)} title={confirm === 'restart' ? 'Restart your 28-day program?' : confirm === 'clear' ? 'Clear client-side data?' : 'Log out of SmartDiet AI?'} description={confirm === 'restart' ? 'Today becomes Day 1. Your server profile, meal plans and logs are unchanged.' : confirm === 'clear' ? 'This clears water, fasting, favourites, grocery ticks, onboarding draft and UI preferences stored on this device. Server data is unchanged.' : 'Your private data stored on this device will be cleared before returning to login.'} confirmLabel={confirm === 'restart' ? 'Restart program' : confirm === 'clear' ? 'Clear device data' : 'Log out'} onCancel={() => setConfirm(null)} onConfirm={performConfirmed} />
  </Page>
}

function HistoryPanel({ plans }) {
  if (!plans.length) return <EmptyState title="No saved plans" description="Generated plans will appear here when the backend returns meal-plan history." />
  return <div className="grid gap-3 sm:grid-cols-2">{plans.map((plan, index) => <div key={plan.date || index} className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center gap-2"><Clock3 size={16} className="text-accent" /><strong>{plan.date || `Saved plan ${index + 1}`}</strong></div><p className="mt-2 text-sm text-muted">{Math.round(plan.targets?.calories || plan.totals?.calories || 0)} kcal · {Object.values(plan.meals || {}).slice(0, 4).flat().length} foods</p></div>)}</div>
}
function FavouritesPanel({ foods, onRemove }) {
  if (!foods.length) return <EmptyState title="No favourite meals" description="Star foods in Food Log search to keep them here." />
  return <div className="space-y-2">{foods.map((food) => <div key={food.id} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-surface p-3"><span><strong className="block">{food.name}</strong><span className="text-xs text-muted">{Math.round(food.calories || 0)} kcal</span></span><Button size="sm" variant="ghost" onClick={() => onRemove(food.id)}>Remove</Button></div>)}</div>
}
function TargetsPanel({ targets }) {
  if (!targets.calories) return <EmptyState title="No targets yet" description="Generate today’s plan to see your read-only nutrition targets." />
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Calories', targets.calories, 'kcal'], ['Protein', targets.protein, 'g'], ['Carbs', targets.carbs, 'g'], ['Fat', targets.fat, 'g'], ['Fibre', targets.fibre, 'g']].map(([label, value, unit]) => <div key={label} className="rounded-2xl bg-surface p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-bold">{Math.round(value)} {unit}</p></div>)}</div>
}
function CustomizePanel({ selected, onToggle }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(tileLabels).map(([key, label]) => <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-surface p-3"><input type="checkbox" checked={selected.includes(key)} onChange={() => onToggle(key)} className="h-5 w-5 accent-[#D9EC7D]" />{label}</label>)}</div>
}
function FoodPreferencesPanel({ value, onSave }) {
  const cuisines = ['north_indian', 'south_indian', 'gujarati', 'maharashtrian', 'bengali', 'punjabi', 'rajasthani', 'east_indian', 'other']
  const [draft, setDraft] = useState(value)
  const [disliked, setDisliked] = useState((value.disliked_foods || []).join(', '))
  const update = (key, next) => setDraft((current) => ({ ...current, [key]: next }))
  const toggleCuisine = (item) => setDraft((current) => ({ ...current, cuisine_regions: current.cuisine_regions.includes(item) ? current.cuisine_regions.filter((entry) => entry !== item) : current.cuisine_regions.length < 4 ? [...current.cuisine_regions, item] : current.cuisine_regions }))
  const save = () => onSave({ ...draft, disliked_foods: disliked.split(',').map((item) => item.replace(/[^A-Za-z0-9 -]/g, '').trim().slice(0, 40)).filter(Boolean).slice(0, 10) })
  return <div className="space-y-5"><fieldset><legend className="mb-2 font-semibold">Cuisine regions (up to 4)</legend><div className="flex flex-wrap gap-2">{cuisines.map((item) => <button key={item} type="button" aria-pressed={draft.cuisine_regions.includes(item)} onClick={() => toggleCuisine(item)} className={`min-h-11 rounded-full border px-4 text-sm ${draft.cuisine_regions.includes(item) ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface'}`}>{title(item)}</button>)}</div></fieldset><div className="grid gap-4 sm:grid-cols-2"><PreferenceSelect label="Meals per day" value={draft.meals_per_day} options={[3, 4, 5]} onChange={(next) => update('meals_per_day', Number(next))} /><PreferenceSelect label="Spice level" value={draft.spice_level} options={['mild', 'medium', 'hot']} onChange={(next) => update('spice_level', next)} /><PreferenceSelect label="Cooking time" value={draft.cooking_time} options={['quick', 'normal', 'any']} onChange={(next) => update('cooking_time', next)} /><PreferenceSelect label="Budget" value={draft.budget} options={['low', 'medium', 'any']} onChange={(next) => update('budget', next)} /></div><Input label="Disliked foods (comma separated, up to 10)" value={disliked} onChange={(event) => setDisliked(event.target.value)} /><Button onClick={save}>Save food preferences</Button></div>
}
function PreferenceSelect({ label, value, options, onChange }) {
  return <label><span className="mb-2 block text-sm font-medium">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4">{options.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
}
function AboutPanel() {
  return <div className="space-y-4 text-sm leading-6 text-muted"><div><h3 className="font-semibold text-ink">SmartDiet AI</h3><p>Personalized Indian-food meal planning, food tracking and practical nutrition guidance from the SmartDiet AI team.</p></div><a href="https://github.com/sumeetwagh01/SmartDietAI" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent">View project on GitHub<ExternalLink size={15} /></a><p className="rounded-2xl border border-line bg-surface p-4"><strong className="text-ink">Medical disclaimer:</strong> SmartDiet AI provides general nutrition information and does not diagnose, treat or replace advice from a qualified medical professional.</p></div>
}
