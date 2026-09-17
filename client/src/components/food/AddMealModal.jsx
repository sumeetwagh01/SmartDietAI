import { useState } from 'react'

import { logFood } from '@/api/foodLog'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

export default function AddMealModal({ food, date, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(1)
  const [mealType, setMealType] = useState('breakfast')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!food) return null

  const save = async () => {
    setLoading(true)
    setError('')
    const multiplier = Number(quantity) || 1
    const entry = {
      food_name: food.name,
      quantity: multiplier,
      unit: 'serving',
      calories: (food.calories || 0) * multiplier,
      protein: (food.protein || 0) * multiplier,
      carbs: (food.carbs || 0) * multiplier,
      fat: (food.fat || 0) * multiplier,
      fibre: (food.fibre || 0) * multiplier,
      sodium: (food.sodium || 0) * multiplier,
    }
    try {
      await logFood({ date, meal_type: mealType, entries: [entry] })
      onSaved?.()
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save this food. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex min-h-full items-center justify-center bg-gray-900/40 p-4">
      <Card className="w-full max-w-md space-y-4">
        <div><p className="text-sm text-gray-500">Add food</p><h2 className="text-xl font-semibold">{food.name}</h2></div>
        <Input label="Quantity" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <label className="block space-y-1.5 text-left"><span className="text-sm font-medium text-gray-700">Meal type</span><select value={mealType} onChange={(event) => setMealType(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-green"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={save}>Save</Button></div>
      </Card>
    </div>
  )
}
