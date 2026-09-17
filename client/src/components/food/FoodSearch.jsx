import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { searchFood } from '@/api/nutrition'

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const requestId = useRef(0)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      setActiveIndex(-1)
      return undefined
    }
    const currentRequest = ++requestId.current
    setLoading(true)
    const timer = setTimeout(() => {
      searchFood(query.trim())
        .then((foods) => {
          if (currentRequest === requestId.current) {
            setResults(foods)
            setActiveIndex(-1)
          }
        })
        .catch(() => {
          if (currentRequest === requestId.current) setResults([])
        })
        .finally(() => {
          if (currentRequest === requestId.current) setLoading(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const selectFood = (food) => {
    onSelect(food)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }

  const handleKeyDown = (event) => {
    if (!results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      selectFood(results[activeIndex])
    } else if (event.key === 'Escape') {
      setResults([])
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400" size={19} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Search foods or meals" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(query.trim())} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-brand-green focus:ring-2 focus:ring-green-100" />
      {query.trim() && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
          {loading && <p className="px-3 py-3 text-sm text-gray-500">Searching foods…</p>}
          {!loading && results.length === 0 && <p className="px-3 py-3 text-sm text-gray-500">No matching foods found.</p>}
          {!loading && results.map((food, index) => (
            <button key={food.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectFood(food)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${index === activeIndex ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              <span><span className="block font-medium text-gray-800">{food.name}</span><span className="text-xs text-gray-500">{food.meal_type}</span></span>
              <span className="ml-3 whitespace-nowrap text-sm text-gray-500">{Math.round(food.calories || 0)} kcal</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
