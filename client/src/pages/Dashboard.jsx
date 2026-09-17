import { useCallback, useEffect, useState } from 'react'

import { getFoodLog } from '@/api/foodLog'
import { generatePlan, getTodayPlan } from '@/api/mealPlan'
import AITipCard from '@/components/dashboard/AITipCard'
import CalorieRing from '@/components/dashboard/CalorieRing'
import MacroBars from '@/components/dashboard/MacroBars'
import MealSummaryCard from '@/components/dashboard/MealSummaryCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

const today = new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const [plan, setPlan] = useState(null)
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [planData, logData] = await Promise.all([getTodayPlan(), getFoodLog(today)])
      setPlan(planData?.plan === null ? null : planData)
      setLog(logData)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  const generate = async () => {
    setError('')
    setGenerating(true)
    try {
      const generatedPlan = await generatePlan()
      setPlan(generatedPlan)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to generate a meal plan. Please check your profile and try again.')
    } finally {
      setGenerating(false)
    }
  }
  if (loading) return <div className="flex h-64 items-center justify-center text-brand-green"><Spinner size="lg" /></div>

  const totals = plan?.totals || {}
  const targets = plan?.targets || {}
  const consumed = log?.total_calories || 0
  const calorieGoal = targets.target_calories || plan?.calorie_target || totals.calories || 0
  return (
    <div><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-gray-500">Your nutrition at a glance.</p></div>{!plan && <Button loading={generating} onClick={generate}>Generate Today's Plan</Button>}</div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Card><h2 className="mb-3 font-semibold">Daily calories</h2><CalorieRing consumed={consumed} goal={calorieGoal} /></Card><Card><h2 className="mb-5 font-semibold">Macros</h2><MacroBars current={{ P: log?.total_protein || 0, C: log?.total_carbs || 0, F: log?.total_fat || 0 }} target={{ P: targets.protein_g || totals.protein || 0, C: targets.carbs_g || totals.carbs || 0, F: targets.fat_g || totals.fat || 0 }} /></Card><AITipCard /><div className="md:col-span-2 xl:col-span-3"><MealSummaryCard meals={plan?.meals || {}} /></div></div>
    </div>
  )
}
