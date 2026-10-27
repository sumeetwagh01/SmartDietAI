import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import { entryFromFood, mealLabels } from '@/utils/food'

export default function AddMealModal({ food, mealType = 'breakfast', onClose, onSave }) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const preview = food ? entryFromFood(food, quantity) : null

  const save = async () => {
    if (!food || loading) return
    setLoading(true); setError('')
    try { await onSave(preview); onClose() }
    catch (requestError) { setError(requestError?.message || 'Unable to save this food. Please try again.') }
    finally { setLoading(false) }
  }

  return <BottomSheet open={Boolean(food)} title={`Add to ${mealLabels[mealType]}`} onClose={onClose}>{food ? <div className="space-y-5"><div><p className="text-xl font-semibold">{food.name || food.food_name}</p><p className="mt-1 text-sm text-muted">{food.unit || '1 serving'}</p></div><div><span className="mb-2 block text-sm font-medium">Quantity</span><div className="flex items-center justify-between rounded-2xl bg-surface-2 p-1"><button type="button" onClick={() => setQuantity((value) => Math.max(0.25, value - 0.25))} className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-surface" aria-label="Decrease quantity"><Minus size={18} /></button><input aria-label="Quantity" type="number" min="0.25" step="0.25" value={quantity} onChange={(event) => setQuantity(Math.max(0.25, Number(event.target.value) || 0.25))} className="w-24 bg-transparent text-center text-xl font-bold outline-none" /><button type="button" onClick={() => setQuantity((value) => value + 0.25)} className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-surface" aria-label="Increase quantity"><Plus size={18} /></button></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Calories', preview.calories, 'kcal'], ['Protein', preview.protein, 'g'], ['Carbs', preview.carbs, 'g'], ['Fat', preview.fat, 'g'], ['Fibre', preview.fibre, 'g']].map(([label, value, unit]) => <div key={label} className="rounded-2xl bg-surface-2 p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-bold">{Math.round(value)}<span className="ml-1 text-xs font-normal text-muted">{unit}</span></p></div>)}</div>{error ? <p className="text-sm text-error" role="alert">{error}</p> : null}<Button className="w-full" loading={loading} loadingLabel="Saving…" onClick={save}>Add food</Button></div> : null}</BottomSheet>
}
