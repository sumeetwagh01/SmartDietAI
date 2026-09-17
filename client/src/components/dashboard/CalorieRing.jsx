import { motion } from 'framer-motion'

export default function CalorieRing({ consumed = 0, goal = 0 }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
        <motion.circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} className="text-brand-green" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
        <span className="text-xs text-gray-500">{Math.max(Math.round(goal - consumed), 0)} kcal left</span>
      </div>
    </div>
  )
}
