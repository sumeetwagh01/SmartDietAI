import { Search, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { searchFood } from '@/api/nutrition'

export default function FoodSearch({ onSelect, favouriteIds = [], onToggleFavourite }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  useEffect(() => {
    if (!query.trim()) {
      return undefined
    }
    const currentRequest = ++requestId.current
    const timer = setTimeout(() => {
      searchFood(query.trim())
        .then((foods) => {
          if (currentRequest === requestId.current) {
            setResults(foods)
            setActiveIndex(-1)
          }
        })
        .catch(() => {
          if (currentRequest === requestId.current) { setResults([]); setError('Food search is unavailable. Please try again.') }
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
      <label htmlFor="food-search" className="sr-only">Search foods</label><Search className="absolute left-4 top-3.5 text-muted" size={19} />
      <input id="food-search" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setError(''); if (value.trim()) setLoading(true); else { setResults([]); setLoading(false); setActiveIndex(-1) } }} onKeyDown={handleKeyDown} placeholder="Search foods or meals" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(query.trim())} className="min-h-12 w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-ink outline-none placeholder:text-muted" />
      {query.trim() && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-surface p-1 shadow-soft">
          {loading && <p className="px-3 py-3 text-sm text-muted">Searching foods…</p>}
          {!loading && error && <p className="px-3 py-3 text-sm text-error">{error}</p>}
          {!loading && !error && results.length === 0 && <p className="px-3 py-3 text-sm text-muted">No matching foods found.</p>}
          {!loading && results.map((food, index) => <div key={food.id} className={`flex items-center rounded-xl ${index === activeIndex ? 'bg-accent/10' : 'hover:bg-surface-2'}`}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectFood(food)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between px-3 py-2 text-left"><span className="min-w-0"><span className="block truncate font-medium text-ink">{food.name}</span><span className="text-xs capitalize text-muted">{food.meal_type}</span></span><span className="ml-3 whitespace-nowrap text-sm text-muted">{Math.round(food.calories || 0)} kcal</span></button>{onToggleFavourite ? <button type="button" onClick={() => onToggleFavourite(food.id)} className={`grid min-h-11 min-w-11 place-items-center rounded-full ${favouriteIds.includes(String(food.id)) ? 'text-carbs' : 'text-muted'}`} aria-label={`${favouriteIds.includes(String(food.id)) ? 'Remove' : 'Add'} ${food.name} ${favouriteIds.includes(String(food.id)) ? 'from' : 'to'} favourites`}><Star size={18} fill={favouriteIds.includes(String(food.id)) ? 'currentColor' : 'none'} /></button> : null}</div>)}
        </div>
      )}
    </div>
  )
}
