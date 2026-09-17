import { Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { updateMe } from '@/api/auth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import useAuthStore from '@/store/authStore'

const goals = [
  ['weight_loss', 'Weight loss'],
  ['maintenance', 'Maintenance'],
  ['muscle_gain', 'Muscle gain'],
  ['weight_gain', 'Weight gain'],
]
const conditions = ['diabetes', 'hypertension', 'lactose_intolerance', 'gluten_intolerance', 'kidney_disease', 'heart_disease', 'pcos', 'hypothyroid']
const allergens = ['dairy', 'nuts', 'gluten', 'eggs', 'fish']

export default function Onboarding() {
  const navigate = useNavigate()
  const { token, setAuth } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ goal: 'maintenance', age: '', gender: 'male', weight_kg: '', height_cm: '', activity_level: 'moderate', medical_conditions: [], allergens: [], is_vegetarian: false, is_vegan: false })
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const toggleList = (key, value) => update(key, data[key].includes(value) ? data[key].filter((item) => item !== value) : [...data[key], value])

  const finish = async () => {
    setLoading(true)
    try {
      const updated = await updateMe({ ...data, age: Number(data.age), weight_kg: Number(data.weight_kg), height_cm: Number(data.height_cm) })
      setAuth(updated, token)
      navigate('/dashboard')
    } finally { setLoading(false) }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4"><Card className="w-full max-w-3xl p-6 sm:p-8"><div className="mb-8"><p className="text-sm font-semibold text-brand-green">Step {step} of 3</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${step * 33.333}%` }} /></div></div>
      {step === 1 && <div><h1 className="text-2xl font-bold">What is your goal?</h1><p className="mt-1 text-gray-500">Your targets will be calculated around this.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{goals.map(([value, label]) => <button key={value} type="button" onClick={() => update('goal', value)} className={`flex items-center justify-between rounded-xl border p-5 text-left font-semibold ${data.goal === value ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200 bg-white text-gray-700'}`}>{label}{data.goal === value && <Check size={19} />}</button>)}</div></div>}
      {step === 2 && <div><h1 className="text-2xl font-bold">Tell us about your body</h1><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Age" type="number" value={data.age} onChange={(event) => update('age', event.target.value)} /><div><span className="mb-1.5 block text-sm font-medium text-gray-700">Gender</span><div className="grid grid-cols-2 gap-2">{['male', 'female'].map((value) => <button key={value} type="button" onClick={() => update('gender', value)} className={`rounded-lg border px-3 py-2.5 capitalize ${data.gender === value ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-300 bg-white'}`}>{value}</button>)}</div></div><Input label="Weight (kg)" type="number" value={data.weight_kg} onChange={(event) => update('weight_kg', event.target.value)} /><Input label="Height (cm)" type="number" value={data.height_cm} onChange={(event) => update('height_cm', event.target.value)} /><label className="block space-y-1.5 text-left sm:col-span-2"><span className="text-sm font-medium text-gray-700">Activity level</span><select value={data.activity_level} onChange={(event) => update('activity_level', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-green"><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very_active">Very active</option></select></label></div></div>}
      {step === 3 && <div><h1 className="text-2xl font-bold">Health and preferences</h1><p className="mt-1 text-gray-500">Select everything that applies.</p><h2 className="mb-2 mt-6 font-semibold">Medical conditions</h2><div className="grid gap-2 sm:grid-cols-2">{conditions.map((condition) => <label key={condition} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm"><input type="checkbox" checked={data.medical_conditions.includes(condition)} onChange={() => toggleList('medical_conditions', condition)} className="accent-brand-green" /><span className="capitalize">{condition.replaceAll('_', ' ')}</span></label>)}</div><h2 className="mb-2 mt-5 font-semibold">Allergens</h2><div className="flex flex-wrap gap-2">{allergens.map((allergen) => <label key={allergen} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"><input type="checkbox" checked={data.allergens.includes(allergen)} onChange={() => toggleList('allergens', allergen)} className="accent-brand-green" /><span className="capitalize">{allergen}</span></label>)}</div><div className="mt-5 flex flex-wrap gap-3">{[['is_vegetarian', 'Vegetarian'], ['is_vegan', 'Vegan']].map(([key, label]) => <button key={key} type="button" onClick={() => update(key, !data[key])} className={`rounded-full border px-4 py-2 text-sm font-medium ${data[key] ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200'}`}>{label}</button>)}</div></div>}
      <div className="mt-8 flex justify-between"><Button variant="ghost" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>Back</Button>{step < 3 ? <Button onClick={() => setStep((value) => value + 1)}>Continue</Button> : <Button loading={loading} onClick={finish}>Finish</Button>}</div>
    </Card></main>
  )
}
