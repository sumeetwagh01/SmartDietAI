import { Copy, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { appendFoodEntries, deleteEntry, getFoodLog } from '@/api/foodLog'
import AddMealModal from '@/components/food/AddMealModal'
import FoodSearch from '@/components/food/FoodSearch'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DateSwitcher from '@/components/ui/DateSwitcher'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import useApi from '@/hooks/useApi'
import useFoodStore from '@/store/foodStore'
import usePrefsStore from '@/store/prefsStore'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'
import { shiftDate } from '@/utils/dates'
import { foodTotals, mealLabels, mealSlots } from '@/utils/food'
import { getApiError } from '@/utils/apiError'

const normalizeMeal = (value) => value === 'snacks' ? 'snack' : mealSlots.includes(value) ? value : 'breakfast'

export default function FoodLog() {
  const location = useLocation()
  const { todayLogs, selectedDate, setLogs, setDate } = useFoodStore()
  const { favouriteFoodIds, toggleFavouriteFood } = usePrefsStore()
  const { mealAssignments, setMealAssignments, removeMealAssignment } = useWellnessStore()
  const showToast = useToastStore((state) => state.show)
  const [meal, setMeal] = useState('breakfast')
  const [selectedFood, setSelectedFood] = useState(null)
  const [deleteIndex, setDeleteIndex] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [copying, setCopying] = useState(false)
  const query = useApi(() => getFoodLog(selectedDate), { immediate: false, errorMessage: 'Unable to load this food log.' })
  const { execute } = query

  useEffect(() => {
    Promise.resolve().then(() => {
      if (location.state?.date && location.state.date !== selectedDate) setDate(location.state.date)
      if (location.state?.meal && mealSlots.includes(location.state.meal)) setMeal(location.state.meal)
    })
  }, [location.state, selectedDate, setDate])

  const assignmentsFor = useCallback((date, log) => {
    const entries = log?.entries || []
    const stored = useWellnessStore.getState().mealAssignments[date] || []
    const fallback = normalizeMeal(log?.meal_type)
    return entries.map((_, index) => stored[index] || fallback)
  }, [])

  const load = useCallback(async () => {
    const log = await execute()
    const entries = log?.entries || []
    const assignments = assignmentsFor(selectedDate, log)
    setLogs(entries)
    setMealAssignments(selectedDate, assignments)
    return { log, entries, assignments }
  }, [assignmentsFor, execute, selectedDate, setLogs, setMealAssignments])

  useEffect(() => { Promise.resolve().then(() => load().catch(() => {})) }, [load])

  const assignments = useMemo(() => todayLogs.map((_, index) => mealAssignments[selectedDate]?.[index] || normalizeMeal(query.data?.meal_type)), [mealAssignments, query.data?.meal_type, selectedDate, todayLogs])
  const mealEntries = todayLogs.map((entry, index) => ({ entry, index })).filter(({ index }) => assignments[index] === meal)
  const dailyTotals = foodTotals(todayLogs)
  const currentTotals = foodTotals(mealEntries.map(({ entry }) => entry))

  const addEntry = async (entry) => {
    try {
      const result = await appendFoodEntries({ date: selectedDate, meal_type: meal, entries: [entry] })
      const nextEntries = result.entries || [...todayLogs, entry]
      const currentAssignments = useWellnessStore.getState().mealAssignments[selectedDate] || []
      const preserved = nextEntries.slice(0, -1).map((_, index) => currentAssignments[index] || assignments[index] || normalizeMeal(result.meal_type))
      setLogs(nextEntries)
      setMealAssignments(selectedDate, [...preserved, meal])
      query.setData(result)
      showToast(`${entry.food_name} added to ${mealLabels[meal]}.`)
    } catch (error) { throw new Error(getApiError(error, 'Unable to add food.')) }
  }

  const confirmDelete = async () => {
    if (deleteIndex == null || deleting) return
    setDeleting(true)
    try {
      const result = await deleteEntry(selectedDate, deleteIndex)
      setLogs(result?.entries || todayLogs.filter((_, index) => index !== deleteIndex))
      removeMealAssignment(selectedDate, deleteIndex)
      query.setData(result)
      setDeleteIndex(null)
      showToast('Food removed.')
    } catch (error) { showToast(getApiError(error, 'Unable to remove food.'), 'error') }
    finally { setDeleting(false) }
  }

  const copyYesterday = async () => {
    if (copying) return
    setCopying(true)
    try {
      const yesterday = shiftDate(selectedDate, -1)
      const previous = await getFoodLog(yesterday)
      const previousAssignments = assignmentsFor(yesterday, previous)
      const copied = (previous?.entries || []).filter((_, index) => previousAssignments[index] === meal)
      if (!copied.length) { showToast(`No ${mealLabels[meal].toLowerCase()} entries to copy.`, 'error'); return }
      const result = await appendFoodEntries({ date: selectedDate, meal_type: meal, entries: copied })
      const currentAssignments = useWellnessStore.getState().mealAssignments[selectedDate] || []
      const preserved = result.entries.slice(0, -copied.length).map((_, index) => currentAssignments[index] || assignments[index] || normalizeMeal(result.meal_type))
      setLogs(result.entries)
      setMealAssignments(selectedDate, [...preserved, ...copied.map(() => meal)])
      query.setData(result)
      showToast(`Copied yesterday’s ${mealLabels[meal].toLowerCase()}.`)
    } catch (error) { showToast(getApiError(error, 'Unable to copy yesterday’s meal.'), 'error') }
    finally { setCopying(false) }
  }

  return <Page className="space-y-5"><header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-accent">Daily nutrition</p><h1 className="text-3xl font-bold">Food Log</h1></div><DateSwitcher value={selectedDate} onChange={setDate} /></header><div className="scrollbar-none flex gap-2 overflow-x-auto" role="tablist" aria-label="Meals">{mealSlots.map((slot) => <button key={slot} type="button" role="tab" aria-selected={meal === slot} onClick={() => setMeal(slot)} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold ${meal === slot ? 'bg-accent text-accent-ink' : 'border border-line bg-surface text-muted'}`}>{mealLabels[slot]}</button>)}</div><FoodSearch onSelect={setSelectedFood} favouriteIds={favouriteFoodIds} onToggleFavourite={toggleFavouriteFood} />
    {query.loading || query.status === 'idle' ? <PageSkeleton /> : query.status === 'error' ? <ErrorState message={query.error} onRetry={() => load().catch(() => {})} /> : <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{mealLabels[meal]}</h2><p className="text-sm text-muted">{Math.round(currentTotals.calories)} kcal · {mealEntries.length} {mealEntries.length === 1 ? 'item' : 'items'}</p></div><Button size="sm" variant="secondary" loading={copying} onClick={copyYesterday}><Copy size={16} />Copy yesterday&apos;s {mealLabels[meal].toLowerCase()}</Button></div>{mealEntries.length ? <div>{mealEntries.map(({ entry, index }) => <div key={`${entry.food_name}-${index}`} className="flex items-center justify-between border-b border-line py-3 last:border-0"><div><p className="font-medium">{entry.food_name}</p><p className="text-sm text-muted">{entry.quantity} {entry.unit} · {Math.round(entry.calories || 0)} kcal</p></div><button type="button" onClick={() => setDeleteIndex(index)} className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted hover:bg-error/10 hover:text-error" aria-label={`Delete ${entry.food_name}`}><Trash2 size={18} /></button></div>)}</div> : <div className="py-12 text-center"><p className="font-semibold">No {mealLabels[meal].toLowerCase()} logged</p><p className="mt-1 text-sm text-muted">Search above to add food, or copy yesterday&apos;s meal.</p></div>}</Card><Card className="h-fit"><h2 className="font-semibold">Daily totals</h2><div className="mt-4 space-y-3">{[['Calories', dailyTotals.calories, 'kcal', 'text-accent'], ['Protein', dailyTotals.protein, 'g', 'text-protein'], ['Carbs', dailyTotals.carbs, 'g', 'text-carbs'], ['Fat', dailyTotals.fat, 'g', 'text-fat'], ['Fibre', dailyTotals.fibre, 'g', 'text-fibre']].map(([label, value, unit, color]) => <div key={label} className="flex justify-between text-sm"><span className="text-muted">{label}</span><strong className={color}>{Math.round(value)} {unit}</strong></div>)}</div></Card></div>}
    <AddMealModal food={selectedFood} mealType={meal} onClose={() => setSelectedFood(null)} onSave={addEntry} /><ConfirmDialog open={deleteIndex != null} title="Delete this food?" description="This removes the entry from the selected day. Other logged foods will stay intact." loading={deleting} onCancel={() => setDeleteIndex(null)} onConfirm={confirmDelete} />
  </Page>
}
