import { Bot, ChartNoAxesColumnIncreasing, Home, NotebookTabs, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  [Home, 'Home', '/dashboard'],
  [NotebookTabs, 'Diet Plan', '/meal-plan'],
  [ChartNoAxesColumnIncreasing, 'Progress', '/progress'],
  [Bot, 'NutriBites', '/ai'],
  [User, 'You', '/profile'],
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Main navigation">
      {tabs.map(([Icon, label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>
          <Icon size={20} /><span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
