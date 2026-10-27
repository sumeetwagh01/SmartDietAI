export const mealSlots = ['breakfast', 'lunch', 'snack', 'dinner']
export const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snacks', dinner: 'Dinner' }
export const nutrient = (entry, key) => Number(entry?.[key] ?? entry?.[`${key}_g`] ?? 0) || 0

export const foodTotals = (entries = []) => entries.reduce((totals, entry) => ({
  calories: totals.calories + nutrient(entry, 'calories'),
  protein: totals.protein + nutrient(entry, 'protein'),
  carbs: totals.carbs + nutrient(entry, 'carbs'),
  fat: totals.fat + nutrient(entry, 'fat'),
  fibre: totals.fibre + nutrient(entry, 'fibre'),
}), { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })

export const entryFromFood = (food, quantity = 1) => ({
  food_name: food.food_name || food.name,
  quantity: Number(quantity),
  unit: food.unit || 'serving',
  calories: nutrient(food, 'calories') * Number(quantity),
  protein: nutrient(food, 'protein') * Number(quantity),
  carbs: nutrient(food, 'carbs') * Number(quantity),
  fat: nutrient(food, 'fat') * Number(quantity),
  fibre: nutrient(food, 'fibre') * Number(quantity),
  sodium: nutrient(food, 'sodium') * Number(quantity),
})
