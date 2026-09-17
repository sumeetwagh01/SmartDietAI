import { Trash2 } from 'lucide-react'

export default function FoodLogItem({ item, onDelete }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <div><p className="font-medium text-gray-800">{item.food_name || item.name}</p><p className="text-sm text-gray-500">{item.quantity} {item.unit || 'serving'}</p></div>
      <div className="flex items-center gap-4"><span className="text-sm font-medium">{Math.round(item.calories || 0)} kcal</span><button type="button" onClick={onDelete} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete food"><Trash2 size={18} /></button></div>
    </div>
  )
}
