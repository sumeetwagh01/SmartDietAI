import { Bot, ChartNoAxesColumnIncreasing, ClipboardList, LayoutDashboard, NotebookTabs } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  [LayoutDashboard, 'Dashboard', '/dashboard'],
  [ClipboardList, 'Food Log', '/food-log'],
  [NotebookTabs, 'Meal Plan', '/meal-plan'],
  [Bot, 'AI Advisor', '/ai'],
  [ChartNoAxesColumnIncreasing, 'Progress', '/progress'],
]

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-100 bg-white p-4 lg:flex lg:flex-col">
      <nav className="space-y-2">
        {links.map(([Icon, label, to]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-green-50 text-brand-green' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={19} />{label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
