import { useCallback, useEffect, useState } from 'react'

import { deleteEntry, getFoodLog, logFood } from '@/api/foodLog'
import AddMealModal from '@/components/food/AddMealModal'
import FoodLogItem from '@/components/food/FoodLogItem'
import FoodSearch from '@/components/food/FoodSearch'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import useFoodStore from '@/store/foodStore'

export default function FoodLog() {
  const { todayLogs, selectedDate, setLogs, removeLog, setDate } = useFoodStore()
  const [selectedFood, setSelectedFood] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const data = await getFoodLog(selectedDate)
    setLogs(data.entries || [])
  }, [selectedDate, setLogs])
  useEffect(() => { load().catch(() => setLogs([])) }, [load, setLogs])

  const remove = async (index) => { await deleteEntry(selectedDate, index); removeLog(index) }
  const save = async () => {
    setSaving(true)
    try { await logFood({ date: selectedDate, meal_type: 'mixed', entries: todayLogs }) } finally { setSaving(false) }
  }
  const total = todayLogs.reduce((sum, item) => sum + (item.calories || 0), 0)

  return (
    <div className="relative min-h-full"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Food Log</h1><p className="text-gray-500">Track everything you eat.</p></div><label className="text-sm font-medium text-gray-700">Date<input type="date" value={selectedDate} onChange={(event) => setDate(event.target.value)} className="ml-2 rounded-lg border border-gray-200 bg-white px-3 py-2" /></label></div>
      <div className="mx-auto max-w-3xl space-y-4"><FoodSearch onSelect={setSelectedFood} /><Card>{todayLogs.length ? todayLogs.map((item, index) => <FoodLogItem key={`${item.food_name}-${index}`} item={item} onDelete={() => remove(index)} />) : <p className="py-8 text-center text-gray-400">No food logged for this date.</p>}<div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-4"><span className="font-semibold">Total calories</span><span className="text-xl font-bold text-brand-green">{Math.round(total)} kcal</span></div></Card><Button className="w-full" loading={saving} disabled={!todayLogs.length} onClick={save}>Save Log</Button></div>
      <AddMealModal food={selectedFood} date={selectedDate} onClose={() => setSelectedFood(null)} onSaved={load} />
    </div>
  )
}
