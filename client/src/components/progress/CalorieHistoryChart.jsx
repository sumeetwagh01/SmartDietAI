import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function CalorieHistoryChart({ data }) {
  return (
    <div className="h-72 w-full text-brand-green">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}><CartesianGrid strokeDasharray="3 3" className="text-gray-100" /><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="total_calories" fill="currentColor" radius={[6, 6, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </div>
  )
}
