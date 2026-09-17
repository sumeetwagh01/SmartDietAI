import { useEffect, useState } from 'react'

import { addWeight, getProgress } from '@/api/progress'
import CalorieHistoryChart from '@/components/progress/CalorieHistoryChart'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

const iso = (date) => date.toISOString().slice(0, 10)

export default function Progress() {
  const [data, setData] = useState([])
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    getProgress(iso(start), iso(end)).then((rows) => setData(rows.map((row) => ({ ...row, day: new Date(`${row.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }) })))).catch(() => setData([]))
  }, [])
  const saveWeight = async () => { if (!weight) return; setSaving(true); try { await addWeight(Number(weight), iso(new Date())); setWeight('') } finally { setSaving(false) } }
  return <div><div className="mb-6"><h1 className="text-2xl font-bold">Progress</h1><p className="text-gray-500">See your consistency over the last seven days.</p></div><div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><h2 className="mb-4 text-lg font-semibold">Calorie history</h2><CalorieHistoryChart data={data} /></Card><Card><h2 className="mb-4 text-lg font-semibold">Log weight</h2><div className="space-y-3"><Input label="Weight (kg)" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="70.0" /><Button className="w-full" loading={saving} onClick={saveWeight}>Save weight</Button></div></Card></div></div>
}
