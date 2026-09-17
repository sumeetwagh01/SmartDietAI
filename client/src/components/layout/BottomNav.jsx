import { Bot, Home, NotebookTabs, PlusCircle, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  [Home, 'Home', '/dashboard'],
  [PlusCircle, 'Log', '/food-log'],
  [NotebookTabs, 'Plan', '/meal-plan'],
  [Bot, 'AI', '/ai'],
  [User, 'Profile', '/profile'],
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-gray-200 bg-white px-2 py-2 lg:hidden">
      {tabs.map(([Icon, label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-14 flex-col items-center gap-1 text-xs ${isActive ? 'text-brand-green' : 'text-gray-500'}`}>
          <Icon size={20} /><span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
