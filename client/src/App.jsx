import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import BottomNav from '@/components/layout/BottomNav'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import AIAdvisor from '@/pages/AIAdvisor'
import Dashboard from '@/pages/Dashboard'
import FoodLog from '@/pages/FoodLog'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import MealPlan from '@/pages/MealPlan'
import Onboarding from '@/pages/Onboarding'
import Profile from '@/pages/Profile'
import Progress from '@/pages/Progress'
import Register from '@/pages/Register'

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto flex max-w-7xl">
          <Sidebar />
          <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}
