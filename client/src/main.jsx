import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const savedTheme = JSON.parse(localStorage.getItem('smartdiet-prefs') || '{}')?.state?.theme
  document.documentElement.classList.toggle('dark', savedTheme !== 'light')
} catch {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
