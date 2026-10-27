import { Bot, ChartNoAxesColumnIncreasing, Home, LogOut, NotebookTabs, User } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import useAuthStore from '@/store/authStore'
import useToastStore from '@/store/toastStore'
import { clearPerUserClientData } from '@/utils/session'

const links = [
  [Home, 'Home', '/dashboard'],
  [NotebookTabs, 'Diet Plan', '/meal-plan'],
  [ChartNoAxesColumnIncreasing, 'Progress', '/progress'],
  [Bot, 'NutriBites', '/ai'],
  [User, 'You', '/profile'],
]

export default function Sidebar() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const showToast = useToastStore((state) => state.show)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const logout = () => {
    clearPerUserClientData()
    clearAuth()
    showToast("You've been logged out")
    navigate('/login', { replace: true })
  }
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface px-4 py-6 lg:flex lg:flex-col">
      <NavLink to="/dashboard" className="mb-10 flex items-center gap-3 px-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-ink">S</span>SmartDiet AI</NavLink>
      <nav className="space-y-2" aria-label="Main navigation">
        {links.map(([Icon, label, to]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition ${isActive ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}>
            <Icon size={19} />{label}
          </NavLink>
        ))}
      </nav>
      <button type="button" onClick={() => setConfirmLogout(true)} className="mt-auto flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-error hover:bg-error/10"><LogOut size={19} />Logout</button>
      <ConfirmDialog open={confirmLogout} title="Log out of SmartDiet AI?" description="Your private data stored on this device will be cleared before returning to login." confirmLabel="Log out" onCancel={() => setConfirmLogout(false)} onConfirm={logout} />
    </aside>
  )
}
