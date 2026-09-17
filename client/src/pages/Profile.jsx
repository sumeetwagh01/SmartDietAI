import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { updateMe } from '@/api/auth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import useAuthStore from '@/store/authStore'

export default function Profile() {
  const navigate = useNavigate()
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const [data, setData] = useState({ name: user?.name || '', age: user?.age || '', weight_kg: user?.weight_kg || '', height_cm: user?.height_cm || '' })
  const [saving, setSaving] = useState(false)
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const save = async () => { setSaving(true); try { const updated = await updateMe({ ...data, age: Number(data.age), weight_kg: Number(data.weight_kg), height_cm: Number(data.height_cm) }); setAuth(updated, token) } finally { setSaving(false) } }
  const logout = () => { clearAuth(); navigate('/') }
  return <div className="mx-auto max-w-2xl"><div className="mb-6"><h1 className="text-2xl font-bold">Profile</h1><p className="text-gray-500">Keep your health profile up to date.</p></div><Card className="space-y-4"><Input label="Name" value={data.name} onChange={(event) => update('name', event.target.value)} /><Input label="Email" value={user?.email || ''} disabled /><div className="grid gap-4 sm:grid-cols-3"><Input label="Age" type="number" value={data.age} onChange={(event) => update('age', event.target.value)} /><Input label="Weight (kg)" type="number" value={data.weight_kg} onChange={(event) => update('weight_kg', event.target.value)} /><Input label="Height (cm)" type="number" value={data.height_cm} onChange={(event) => update('height_cm', event.target.value)} /></div><div className="flex flex-wrap justify-between gap-3 pt-2"><Button variant="ghost" onClick={logout}>Logout</Button><Button loading={saving} onClick={save}>Save changes</Button></div></Card></div>
}
