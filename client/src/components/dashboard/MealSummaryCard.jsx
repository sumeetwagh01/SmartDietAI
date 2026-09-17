import Card from '@/components/ui/Card'

const slots = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealSummaryCard({ meals = {} }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Today's meals</h2>
      <div className="divide-y divide-gray-100">
        {slots.map((slot) => (
          <div key={slot} className="py-3 first:pt-0 last:pb-0">
            <p className="mb-1 text-sm font-semibold capitalize text-gray-800">{slot}</p>
            {(meals[slot] || []).length ? <p className="text-sm text-gray-500">{meals[slot].map((item) => item.food_name || item.name).join(', ')}</p> : <p className="text-sm text-gray-400">No items planned</p>}
          </div>
        ))}
      </div>
    </Card>
  )
}
