const macros = [
  ['Protein', 'P', 'bg-protein'],
  ['Carbs', 'C', 'bg-carbs'],
  ['Fat', 'F', 'bg-fat'],
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
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{label}</span><span className="text-muted">{Math.round(value)} / {Math.round(goal)}g</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}
