export const requiredProfileFields = [
  'name',
  'age',
  'gender',
  'weight_kg',
  'height_cm',
  'activity_level',
  'goal',
]

export const getMissingProfileFields = (profile) => requiredProfileFields.filter((field) => {
  const value = profile?.[field]
  return value == null || value === ''
})

export const profileIsComplete = (profile) => getMissingProfileFields(profile).length === 0

export const profileDraft = (profile = {}) => ({
  name: profile.name || '',
  age: profile.age ?? '',
  gender: profile.gender || 'male',
  weight_kg: profile.weight_kg ?? '',
  height_cm: profile.height_cm ?? '',
  activity_level: profile.activity_level || 'moderate',
  goal: profile.goal || 'maintenance',
  medical_conditions: Array.isArray(profile.medical_conditions) ? profile.medical_conditions : [],
  allergens: Array.isArray(profile.allergens) ? profile.allergens : [],
  is_vegetarian: Boolean(profile.is_vegetarian),
  is_vegan: Boolean(profile.is_vegan),
})

export const firstIncompleteStep = (profile) => {
  const missing = new Set(getMissingProfileFields(profile))
  if (['name', 'age', 'gender'].some((field) => missing.has(field))) return 1
  if (['height_cm', 'weight_kg'].some((field) => missing.has(field))) return 2
  if (missing.has('activity_level')) return 3
  if (missing.has('goal')) return 4
  return 1
}
