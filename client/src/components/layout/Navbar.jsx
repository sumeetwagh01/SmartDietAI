import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import useAuthStore from '@/store/authStore'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Navbar() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <button onClick={() => navigate('/dashboard')} className="font-bold lg:hidden">SmartDiet <span className="text-accent">AI</span></button>
        <p className="hidden text-sm text-muted lg:block">Nutrition that works with your life.</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/food-log')} className="hidden min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink sm:flex"><Plus size={17} />Log food</button>
          <ThemeToggle />
          <button type="button" onClick={() => navigate('/profile')} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-surface-2 font-semibold text-ink" aria-label="Profile">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  )
}
