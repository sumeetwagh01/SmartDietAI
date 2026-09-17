import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { searchFood } from '@/api/nutrition'

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return undefined
    }
    const timer = setTimeout(() => {
      searchFood(query).then(setResults).catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400" size={19} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-brand-green focus:ring-2 focus:ring-green-100" />
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
          {results.map((food) => (
            <button key={food.id} type="button" onClick={() => { onSelect(food); setQuery(''); setResults([]) }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50">
              <span><span className="block font-medium text-gray-800">{food.name}</span><span className="text-xs text-gray-500">{food.meal_type}</span></span>
              <span className="text-sm text-gray-500">{food.calories} kcal</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
