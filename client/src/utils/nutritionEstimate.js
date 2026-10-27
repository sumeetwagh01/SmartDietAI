const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
const goalOffsets = { weight_loss: -400, maintenance: 0, muscle_gain: 250, weight_gain: 350 }

export default function estimateNutrition(profile) {
  const age = Number(profile.age)
  const weight = Number(profile.weight_kg)
  const height = Number(profile.height_cm)
  if (!age || !weight || !height) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const sexOffset = profile.gender === 'female' ? -161 : 5
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + sexOffset
  const calories = Math.max(1200, Math.round((bmr * (activityFactors[profile.activity_level] || 1.2)) + (goalOffsets[profile.goal] || 0)))
  const protein = Math.round(weight * (profile.goal === 'muscle_gain' ? 1.8 : 1.4))
  const fat = Math.round((calories * 0.28) / 9)
  const carbs = Math.max(0, Math.round((calories - (protein * 4) - (fat * 9)) / 4))
  return { calories, protein, carbs, fat }
}
