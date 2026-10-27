import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getFoodLog } from '@/api/foodLog'
import { getTargets } from '@/api/aiPlan'
import AIChatWindow from '@/components/ai/AIChatWindow'
import SuggestedPrompts from '@/components/ai/SuggestedPrompts'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Page from '@/components/ui/Page'
import { ErrorState, PageSkeleton } from '@/components/ui/StateView'
import useApi from '@/hooks/useApi'
import useAuthStore from '@/store/authStore'
import { toIsoDate } from '@/utils/dates'
import { normalizeAiTargets } from '@/lib/normalizeAiPlan'

const conditionPrompts = {
  hypertension: 'Low-sodium dinner ideas',
  diabetes: 'What is a balanced low-GI snack?',
  heart_disease: 'Heart-friendly meal ideas for today',
  kidney_disease: 'Help me plan a kidney-conscious meal',
  lactose_intolerance: 'Dairy-free protein ideas',
  gluten_intolerance: 'Gluten-free meal ideas',
  pcos: 'Low-GI meal ideas for PCOS',
  hypothyroid: 'Higher-fibre meal ideas for today',
}

export default function AIAdvisor() {
  const [chatOpen, setChatOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const user = useAuthStore((state) => state.user)
  const reduced = useReducedMotion()
  const query = useApi(async () => {
    const [targetPayload, log] = await Promise.all([getTargets(), getFoodLog(toIsoDate(new Date()))])
    return { targets: normalizeAiTargets(targetPayload?.targets), log: log || {} }
  }, { errorMessage: 'Unable to prepare personalized prompts.' })
  const prompts = useMemo(() => {
    const target = Number(query.data?.targets?.calories)
    const eaten = Number(query.data?.log?.total_calories) || 0
    const items = target ? [`What can I eat with my remaining ${Math.max(0, Math.round(target - eaten))} kcal?`] : ['Help me build a balanced meal today']
    for (const condition of user?.medical_conditions || []) if (conditionPrompts[condition]) items.push(conditionPrompts[condition])
    if (user?.is_vegan) items.push('Easy vegan protein ideas')
    else if (user?.is_vegetarian) items.push('Vegetarian protein ideas for today')
    items.push('How can I improve today’s food choices?')
    return [...new Set(items)].slice(0, 5)
  }, [query.data, user?.is_vegan, user?.is_vegetarian, user?.medical_conditions])
  const openPrompt = (value) => { setPrompt(value); setChatOpen(true) }

  if (query.loading) return <PageSkeleton />
  return <Page className="grid min-h-[calc(100vh-9rem)] place-items-center"><motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-accent text-accent-ink shadow-soft"><Sparkles size={32} /></span><p className="mt-7 text-sm font-semibold text-accent">Your nutrition companion</p><h1 className="mt-2 text-4xl font-bold sm:text-5xl">Hi {user?.name?.split(' ')[0] || 'there'}, meet NutriBites.</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-muted">Ask practical questions using your real profile, today’s food log and current meal plan as context.</p><Button size="lg" className="mt-7" onClick={() => setChatOpen(true)}><MessageCircle size={19} />Chat with NutriBites<ArrowRight size={18} /></Button><Card className="mt-8 text-left"><div className="flex items-center gap-2"><ShieldCheck className="text-fibre" size={19} /><h2 className="font-semibold">Try asking</h2></div>{query.status === 'error' ? <ErrorState message={query.error} onRetry={() => query.retry().catch(() => {})} /> : <div className="mt-4"><SuggestedPrompts prompts={prompts} onPrompt={openPrompt} /></div>}</Card><p className="mt-5 text-xs text-muted">NutriBites is not a doctor and doesn&apos;t replace professional medical care.</p></motion.div><AnimatePresence>{chatOpen ? <AIChatWindow prompt={prompt} onPromptHandled={() => setPrompt('')} onClose={() => setChatOpen(false)} /> : null}</AnimatePresence></Page>
}
