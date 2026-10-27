const number = (value) => Number(value) || 0
const text = (value) => typeof value === 'string' ? value : ''
const list = (value) => Array.isArray(value) ? value : []

export const normalizeAiTargets = (value) => {
  if (!value || typeof value !== 'object') return null
  const calculation = value.calculation || {}
  return {
    calories: number(value.calories),
    protein_g: number(value.protein_g),
    carbs_g: number(value.carbs_g),
    fat_g: number(value.fat_g),
    fibre_g: number(value.fibre_g),
    water_ml: number(value.water_ml),
    calculation: {
      bmr_kcal: number(calculation.bmr_kcal),
      tdee_kcal: number(calculation.tdee_kcal),
      goal_adjustment_kcal: number(calculation.goal_adjustment_kcal),
      method: text(calculation.method),
    },
    rationale: text(value.rationale),
    cautions: list(value.cautions).map(text).filter(Boolean),
  }
}

const normalizeItem = (item = {}) => ({
  name: text(item.name || item.food_name),
  food_name: text(item.name || item.food_name),
  quantity: number(item.quantity),
  unit: text(item.unit) || 'serving',
  grams: item.grams == null ? null : number(item.grams),
  calories: number(item.calories),
  protein_g: number(item.protein_g ?? item.protein),
  carbs_g: number(item.carbs_g ?? item.carbs),
  fat_g: number(item.fat_g ?? item.fat),
  fibre_g: number(item.fibre_g ?? item.fibre),
  sodium_mg: number(item.sodium_mg ?? item.sodium),
  ingredients: list(item.ingredients).map(text).filter(Boolean),
  prep_note: text(item.prep_note),
})

export const normalizeAiPlan = (payload) => {
  const hasPlanEnvelope = payload && typeof payload === 'object' && Object.hasOwn(payload, 'plan')
  const value = hasPlanEnvelope ? payload.plan : payload
  if (!value || typeof value !== 'object') return null
  const meals = value.meals || {}
  const snacks = list(meals.snacks ?? meals.snack).map(normalizeItem)
  return {
    ...value,
    date: text(value.date),
    source: text(value.source),
    model: text(value.model),
    targets: normalizeAiTargets(value.targets),
    calorie_target: number(value.targets?.calories),
    totals: {
      calories: number(value.totals?.calories), protein_g: number(value.totals?.protein_g),
      carbs_g: number(value.totals?.carbs_g), fat_g: number(value.totals?.fat_g),
      fibre_g: number(value.totals?.fibre_g), sodium_mg: number(value.totals?.sodium_mg),
    },
    meals: {
      breakfast: list(meals.breakfast).map(normalizeItem),
      lunch: list(meals.lunch).map(normalizeItem),
      snacks,
      snack: snacks,
      dinner: list(meals.dinner).map(normalizeItem),
    },
    why_this_plan: {
      calories: text(value.why_this_plan?.calories), protein: text(value.why_this_plan?.protein),
      conditions: text(value.why_this_plan?.conditions), preferences: text(value.why_this_plan?.preferences),
    },
    tips: list(value.tips).map(text).filter(Boolean),
    cautions: list(value.cautions).map(text).filter(Boolean),
    safety: { checked: Boolean(value.safety?.checked), rules: list(value.safety?.rules).map(text).filter(Boolean) },
  }
}

export default normalizeAiPlan

