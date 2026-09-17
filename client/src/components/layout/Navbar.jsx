import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'

const links = [
  ['Dashboard', '/dashboard'],
  ['Food Log', '/food-log'],
  ['Meal Plan', '/meal-plan'],
  ['AI Advisor', '/ai'],
  ['Progress', '/progress'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()

  const logout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <NavLink to="/dashboard" className="text-xl font-bold text-brand-green">SmartDiet AI</NavLink>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-brand-green' : 'text-gray-600 hover:text-gray-900'}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/profile')} className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 font-semibold text-brand-green" aria-label="Profile">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </button>
          <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">Logout</Button>
          <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-gray-600 lg:hidden" aria-label="Toggle navigation">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="space-y-1 border-t border-gray-100 bg-white p-3 lg:hidden">
          {links.map(([label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{label}</NavLink>)}
        </nav>
      )}
    </header>
  )
}
