import { Moon, Sun } from 'lucide-react'

import usePrefsStore from '@/store/prefsStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = usePrefsStore()
  return <button type="button" onClick={toggleTheme} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
}
