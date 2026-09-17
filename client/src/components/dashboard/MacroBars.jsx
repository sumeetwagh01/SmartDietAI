const macros = [
  ['Protein', 'P', 'bg-brand-blue'],
  ['Carbs', 'C', 'bg-brand-amber'],
  ['Fat', 'F', 'bg-brand-coral'],
]

export default function MacroBars({ current = {}, target = {} }) {
  return (
    <div className="space-y-4">
      {macros.map(([label, key, color]) => {
        const value = current[key] || 0
        const goal = target[key] || 0
        const width = goal ? Math.min((value / goal) * 100, 100) : 0
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{label}</span><span className="text-gray-500">{Math.round(value)} / {Math.round(goal)}g</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}
