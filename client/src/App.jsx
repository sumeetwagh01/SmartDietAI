import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import BottomNav from '@/components/layout/BottomNav'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import ToastViewport from '@/components/ui/ToastViewport'
import OfflineBanner from '@/components/ui/OfflineBanner'
import usePrefsStore from '@/store/prefsStore'
import useAuthStore from '@/store/authStore'
import { PageSkeleton } from '@/components/ui/StateView'
import { clearPerUserClientData } from '@/utils/session'

const AIAdvisor = lazy(() => import('@/pages/AIAdvisor'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const FoodLog = lazy(() => import('@/pages/FoodLog'))
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const MealPlan = lazy(() => import('@/pages/MealPlanAI'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Profile = lazy(() => import('@/pages/Profile'))
const Progress = lazy(() => import('@/pages/Progress'))
const Register = lazy(() => import('@/pages/Register'))

function ThemeSync() {
  const theme = usePrefsStore((state) => state.theme)
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  return null
}

function CrossTabAuthSync() {
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== 'smartdiet-auth') return
      let token = null
      try { token = JSON.parse(event.newValue || '{}')?.state?.token || null } catch { token = null }
      if (!token) {
        clearPerUserClientData()
        useAuthStore.setState({ user: null, token: null, isLoggedIn: false })
        if (window.location.pathname !== '/login') window.location.replace('/login')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return null
}

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-canvas text-ink lg:pl-64">
        <Sidebar />
        <Navbar />
        <main className="mx-auto min-w-0 max-w-[1100px] p-4 pb-28 sm:p-6 lg:pb-10">{children}</main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeSync />
      <CrossTabAuthSync />
      <OfflineBanner />
      <ToastViewport />
      <Suspense fallback={<div className="mx-auto max-w-[1100px] p-6"><PageSkeleton /></div>}><Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<ProtectedPage><Onboarding /></ProtectedPage>} />
        <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
        <Route path="/food-log" element={<ProtectedPage><FoodLog /></ProtectedPage>} />
        <Route path="/meal-plan" element={<ProtectedPage><MealPlan /></ProtectedPage>} />
        <Route path="/ai" element={<ProtectedPage><AIAdvisor /></ProtectedPage>} />
        <Route path="/progress" element={<ProtectedPage><Progress /></ProtectedPage>} />
        <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  )
}
