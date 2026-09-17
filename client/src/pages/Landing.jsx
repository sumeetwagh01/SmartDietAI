import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5"><span className="text-xl font-bold text-brand-green">SmartDiet AI</span><Button variant="ghost" onClick={() => navigate('/login')}>Login</Button></header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-brand-green"><Sparkles size={17} />Personal nutrition, made practical</div>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">Your Personal Diet AI</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">Build meal plans around your goals, health needs, food preferences, and daily progress.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3"><Button size="lg" variant="secondary" onClick={() => navigate('/login')}>Login</Button><Button size="lg" onClick={() => navigate('/register')}>Get Started <ArrowRight size={18} /></Button></div>
      </section>
    </main>
  )
}
