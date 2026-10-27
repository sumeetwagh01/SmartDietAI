const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : []

function normalizeFood(item = {}) {
  return {
    ...item,
    food_name: item.food_name || item.name || 'Food item',
    calories: number(item.calories),
    protein_g: number(item.protein_g ?? item.protein),
    carbs_g: number(item.carbs_g ?? item.carbs),
    fat_g: number(item.fat_g ?? item.fat),
    fibre_g: number(item.fibre_g ?? item.fibre),
  }
}

export default function normalizePlan(payload) {
  const source = payload?.plan && typeof payload.plan === 'object' ? payload.plan : payload
  if (!source || payload?.plan === null) return null
  const meals = source.meals || {}
  const snackItems = [...list(meals.snack), ...list(meals.snacks)]
  const totals = source.totals || {}
  const targets = source.targets || {}
  return {
    ...source,
    meals: {
      breakfast: list(meals.breakfast).map(normalizeFood),
      lunch: list(meals.lunch).map(normalizeFood),
      dinner: list(meals.dinner).map(normalizeFood),
      snack: snackItems.map(normalizeFood),
    },
    totals: {
      calories: number(totals.calories),
      protein: number(totals.protein ?? totals.protein_g),
      carbs: number(totals.carbs ?? totals.carbs_g),
      fat: number(totals.fat ?? totals.fat_g),
      fibre: number(totals.fibre ?? totals.fibre_g),
    },
    targets: {
      ...targets,
      target_calories: number(targets.target_calories ?? source.calorie_target),
      protein_g: number(targets.protein_g ?? targets.protein),
      carbs_g: number(targets.carbs_g ?? targets.carbs),
      fat_g: number(targets.fat_g ?? targets.fat),
      fibre_g: number(targets.fibre_g ?? targets.fibre),
    },
    explanation: source.explanation ?? null,
  }
}
