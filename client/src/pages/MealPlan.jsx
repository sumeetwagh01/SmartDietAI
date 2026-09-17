import { useCallback, useEffect, useState } from 'react'

import { generatePlan, getTodayPlan } from '@/api/mealPlan'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

const slots = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealPlan() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); try { const data = await getTodayPlan(); setPlan(data?.plan === null ? null : data) } finally { setLoading(false) } }, [])
  useEffect(() => { load() }, [load])
  const regenerate = async () => {
    setError('')
    setGenerating(true)
    try {
      setPlan(await generatePlan())
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to generate a meal plan. Please check your profile and try again.')
    } finally {
      setGenerating(false)
    }
  }
  if (loading) return <div className="flex h-64 items-center justify-center text-brand-green"><Spinner size="lg" /></div>

  return (
    <div><div className="mb-6 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Today's Meal Plan</h1><p className="text-gray-500">Balanced around your targets and preferences.</p></div><Button loading={generating} onClick={regenerate}>{plan ? 'Regenerate' : 'Generate plan'}</Button></div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">{slots.map((slot) => <Card key={slot}><h2 className="mb-3 text-lg font-semibold capitalize">{slot}</h2><div className="space-y-3">{(plan?.meals?.[slot] || []).map((item, index) => <div key={`${item.food_name || item.name}-${index}`} className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"><span><span className="block font-medium">{item.food_name || item.name}</span><span className="text-sm text-gray-500">{item.quantity} {item.unit}</span></span><span className="text-sm font-medium">{Math.round(item.calories || 0)} kcal</span></div>)}{!(plan?.meals?.[slot] || []).length && <p className="text-sm text-gray-400">No items</p>}</div></Card>)}</div>
      {plan?.explanation && <Card className="mt-4"><h2 className="mb-3 text-lg font-semibold text-brand-green">Why this plan works</h2>{typeof plan.explanation === 'string' ? <p className="text-sm leading-6 text-gray-600">{plan.explanation}</p> : <div className="grid gap-3 sm:grid-cols-2">{Object.entries(plan.explanation).map(([key, value]) => <div key={key}><p className="text-sm font-semibold capitalize">{key.replaceAll('_', ' ')}</p><p className="text-sm leading-6 text-gray-600">{value}</p></div>)}</div>}</Card>}
    </div>
  )
}
