import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const initialDraft = { name: '', goal: 'maintenance', age: '', gender: 'male', weight_kg: '', height_cm: '', activity_level: 'moderate', medical_conditions: [], allergens: [], is_vegetarian: false, is_vegan: false }
const useOnboardingStore = create(persist((set) => ({
  step: 0,
  draft: initialDraft,
  setStep: (step) => set({ step }),
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ step: 0, draft: initialDraft }),
}), { name: 'smartdiet-onboarding' }))

export default useOnboardingStore
