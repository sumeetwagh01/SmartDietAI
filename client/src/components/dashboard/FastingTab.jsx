import { Bell, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import useToastStore from '@/store/toastStore'
import useWellnessStore from '@/store/wellnessStore'

const plans = ['12:12', '14:10', '16:8', '18:6', '20:4']
const durationMs = (plan) => Number(plan.split(':')[0]) * 60 * 60 * 1000
const durationText = (ms) => { const safe = Math.max(0, ms); const hours = Math.floor(safe / 3600000); const minutes = Math.floor((safe % 3600000) / 60000); const seconds = Math.floor((safe % 60000) / 1000); return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` }

export default function FastingTab({ user }) {
  const { fastingStartedAt, fastingPlan, completedFasts, setFastingPlan, startFast, endFast } = useWellnessStore()
  const showToast = useToastStore((state) => state.show)
  const [now, setNow] = useState(() => new Date().getTime())
  const [confirmStart, setConfirmStart] = useState(false)
  const restricted = Number(user?.age) < 18 || (user?.medical_conditions || []).some((item) => ['diabetes', 'kidney_disease', 'heart_disease'].includes(item))

  useEffect(() => {
    if (!fastingStartedAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [fastingStartedAt])

  const elapsed = fastingStartedAt ? Math.max(0, now - new Date(fastingStartedAt).getTime()) : 0
  const total = durationMs(fastingPlan)
  const percent = Math.min(100, (elapsed / total) * 100)
  const streak = useMemo(() => { const days = new Set(completedFasts.map((fast) => fast.ended_at?.slice(0, 10))); let count = 0; const cursor = new Date(); while (days.has(cursor.toISOString().slice(0, 10))) { count += 1; cursor.setDate(cursor.getDate() - 1) } return count }, [completedFasts])
  const requestReminder = async () => {
    if (!('Notification' in window)) { showToast('Browser notifications are unavailable.', 'error'); return }
    try {
      const permission = await Notification.requestPermission()
      showToast(permission === 'granted' ? 'Fasting reminder enabled.' : 'Notification permission was not granted.', permission === 'granted' ? 'success' : 'error')
    } catch { showToast('Browser notifications are unavailable.', 'error') }
  }
  const begin = () => { if (restricted) setConfirmStart(true); else startFast() }

  return <div className="grid gap-5 lg:grid-cols-2"><Card className="flex flex-col items-center"><div className="w-full"><h2 className="text-xl font-bold">Fasting timer</h2><p className="text-sm text-muted">Choose an eating rhythm that fits your routine.</p></div>{restricted ? <div className="mt-5 flex w-full gap-3 rounded-2xl border border-carbs/30 bg-carbs/10 p-4 text-sm text-carbs"><ShieldAlert className="shrink-0" size={20} /><span>Fasting may not be safe for you — talk to your doctor first.</span></div> : null}<div className="relative mt-7 h-60 w-60 rounded-full" style={{ background: `conic-gradient(#D9EC7D ${percent}%, rgb(var(--color-surface-2)) ${percent}%)` }}><div className="absolute inset-4 grid place-items-center rounded-full bg-surface text-center"><div><p className="text-xs uppercase tracking-wider text-muted">{fastingStartedAt ? 'Elapsed' : 'Ready'}</p><p className="mt-1 text-3xl font-bold">{durationText(elapsed)}</p>{fastingStartedAt ? <p className="mt-1 text-xs text-muted">{durationText(total - elapsed)} remaining</p> : null}</div></div></div><div className="mt-6 flex gap-3">{fastingStartedAt ? <Button variant="danger" onClick={() => { endFast(); showToast('Fast completed.') }}>End fast</Button> : <Button onClick={begin}>Start fast</Button>}<Button variant="secondary" onClick={requestReminder}><Bell size={17} />Remind me</Button></div></Card><div className="space-y-5"><Card><h2 className="font-semibold">Fasting plan</h2><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{plans.map((plan) => <button key={plan} type="button" disabled={Boolean(fastingStartedAt)} onClick={() => setFastingPlan(plan)} className={`min-h-11 rounded-full text-sm font-semibold disabled:opacity-50 ${fastingPlan === plan ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}>{plan}</button>)}</div><p className="mt-3 text-xs text-muted">First number: fasting hours · second: eating window.</p></Card><div className="grid grid-cols-2 gap-4"><Card><p className="text-sm text-muted">Completed</p><p className="mt-2 text-3xl font-bold">{completedFasts.length}</p><p className="text-xs text-muted">fasts</p></Card><Card><p className="text-sm text-muted">Streak</p><p className="mt-2 text-3xl font-bold text-accent">{streak}</p><p className="text-xs text-muted">days</p></Card></div>{completedFasts.length ? <Card><h2 className="font-semibold">Recent fasts</h2><div className="mt-3 space-y-2">{completedFasts.slice(-4).reverse().map((fast) => <div key={fast.ended_at} className="flex justify-between text-sm"><span>{new Date(fast.ended_at).toLocaleDateString()}</span><span className="text-muted">{fast.plan}</span></div>)}</div></Card> : <Card className="text-center text-sm text-muted">Completed fasts will appear here.</Card>}</div><ConfirmDialog open={confirmStart} title="Check with your doctor first" description="Fasting may not be safe for you — talk to your doctor first. Continue only if a qualified professional has said it is appropriate for you." confirmLabel="I understand, start" onCancel={() => setConfirmStart(false)} onConfirm={() => { setConfirmStart(false); startFast() }} /></div>
}
