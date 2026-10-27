import { useMemo, useState } from 'react'

import { updateMe } from '@/api/auth'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useAuthStore from '@/store/authStore'
import useToastStore from '@/store/toastStore'
import { getApiError } from '@/utils/apiError'

const conditions = ['diabetes', 'hypertension', 'lactose_intolerance', 'gluten_intolerance', 'kidney_disease', 'heart_disease', 'pcos', 'hypothyroid']
const allergens = ['dairy', 'gluten', 'nuts', 'eggs', 'fish', 'legumes']
const activities = ['sedentary', 'light', 'moderate', 'active', 'very_active']
const goals = ['weight_loss', 'maintenance', 'muscle_gain', 'weight_gain']
const contractFields = ['name', 'age', 'gender', 'weight_kg', 'height_cm', 'activity_level', 'goal', 'medical_conditions', 'allergens', 'is_vegetarian', 'is_vegan']
const title = (value) => String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const snapshot = (user = {}) => ({ name: user.name || '', age: user.age || '', gender: user.gender || 'male', weight_kg: user.weight_kg || '', height_cm: user.height_cm || '', activity_level: user.activity_level || 'moderate', goal: user.goal || 'maintenance', medical_conditions: Array.isArray(user.medical_conditions) ? user.medical_conditions : [], allergens: Array.isArray(user.allergens) ? user.allergens : [], is_vegetarian: Boolean(user.is_vegetarian), is_vegan: Boolean(user.is_vegan) })

function Chip({ active, children, onClick }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-full border px-4 text-sm ${active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface-2'}`}>{children}</button>
}

export default function ProfileEditSheet({ open, onClose, onProfileChange }) {
  const { user, token, setAuth } = useAuthStore()
  const [form, setForm] = useState(() => snapshot(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const showToast = useToastStore((state) => state.show)
  const original = useMemo(() => snapshot(user), [user])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggle = (key, item) => update(key, form[key].includes(item) ? form[key].filter((value) => value !== item) : [...form[key], item])
  const setDiet = (diet) => setForm((current) => ({ ...current, is_vegan: diet === 'vegan', is_vegetarian: diet !== 'non_vegetarian' }))
  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    const normalized = { ...form, name: form.name.trim(), age: Number(form.age), weight_kg: Number(form.weight_kg), height_cm: Number(form.height_cm) }
    if (!normalized.name || normalized.age < 14 || normalized.age > 100 || normalized.weight_kg < 30 || normalized.height_cm < 120 || !['male', 'female'].includes(normalized.gender)) { setError('Check your name, age, gender, height and weight before saving.'); return }
    const changed = Object.fromEntries(contractFields.filter((key) => JSON.stringify(normalized[key]) !== JSON.stringify(original[key])).map((key) => [key, normalized[key]]))
    if (!Object.keys(changed).length) { showToast('No profile changes to save.'); onClose(); return }
    setSaving(true); setError('')
    try {
      const updated = await updateMe(changed)
      setAuth(updated, token)
      onProfileChange?.(changed)
      showToast('Profile updated.'); onClose()
    } catch (requestError) { setError(getApiError(requestError, 'Unable to update your profile.')) }
    finally { setSaving(false) }
  }
  const diet = form.is_vegan ? 'vegan' : form.is_vegetarian ? 'vegetarian' : 'non_vegetarian'
  return <BottomSheet open={open} title="Edit profile" onClose={onClose}><form className="space-y-6" onSubmit={save}><div className="grid gap-4 sm:grid-cols-2"><Input label="Name" required value={form.name} onChange={(event) => update('name', event.target.value)} /><Input label="Age" type="number" min="14" max="100" required value={form.age} onChange={(event) => update('age', event.target.value)} /><label><span className="mb-2 block text-sm font-medium">Gender</span><select value={form.gender} onChange={(event) => update('gender', event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4"><option value="male">Male</option><option value="female">Female</option></select></label><Input label="Weight (kg)" type="number" min="30" max="300" step="0.1" required value={form.weight_kg} onChange={(event) => update('weight_kg', event.target.value)} /><Input label="Height (cm)" type="number" min="120" max="250" step="0.1" required value={form.height_cm} onChange={(event) => update('height_cm', event.target.value)} /><label><span className="mb-2 block text-sm font-medium">Activity</span><select value={form.activity_level} onChange={(event) => update('activity_level', event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4">{activities.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Goal</span><select value={form.goal} onChange={(event) => update('goal', event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4">{goals.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label></div><fieldset><legend className="mb-3 font-semibold">Diet type</legend><div className="flex flex-wrap gap-2">{[['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['non_vegetarian', 'Non-vegetarian']].map(([key, label]) => <Chip key={key} active={diet === key} onClick={() => setDiet(key)}>{label}</Chip>)}</div></fieldset><fieldset><legend className="mb-3 font-semibold">Health conditions</legend><div className="flex flex-wrap gap-2"><Chip active={!form.medical_conditions.length} onClick={() => update('medical_conditions', [])}>None</Chip>{conditions.map((item) => <Chip key={item} active={form.medical_conditions.includes(item)} onClick={() => toggle('medical_conditions', item)}>{title(item)}</Chip>)}</div></fieldset><fieldset><legend className="mb-3 font-semibold">Allergies</legend><div className="flex flex-wrap gap-2"><Chip active={!form.allergens.length} onClick={() => update('allergens', [])}>None</Chip>{allergens.map((item) => <Chip key={item} active={form.allergens.includes(item)} onClick={() => toggle('allergens', item)}>{title(item)}</Chip>)}</div><p className="mt-2 text-xs text-muted">Nuts covers peanut and tree-nut allergies. Free-text allergens are not supported.</p></fieldset><p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">This is not medical advice; keep your doctor&apos;s guidance first.</p>{error ? <p role="alert" className="text-sm text-error">{error}</p> : null}<Button type="submit" className="w-full" loading={saving} loadingLabel="Saving…">Save profile</Button></form></BottomSheet>
}
