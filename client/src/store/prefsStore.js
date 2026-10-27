import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePrefsStore = create(persist((set) => ({
  theme: 'dark',
  targetWeightKg: null,
  waterGoalMl: null,
  fastingPreference: 'none',
  remindersEnabled: false,
  units: 'metric',
  programStartDate: null,
  favouriteFoodIds: [],
  reportTiles: ['weight', 'calories', 'protein', 'carbs', 'fat', 'fibre', 'water'],
  aiPreferences: { cuisine_regions: [], meals_per_day: 4, spice_level: 'medium', cooking_time: 'any', budget: 'any', disliked_foods: [], target_weight_kg: null, fasting: 'none' },
  setTheme: (theme) => set({ theme }),
  setUnits: (units) => set({ units }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg }),
  setRoutine: (routine) => set((state) => ({ ...state, ...routine })),
  setProgramStartDate: (programStartDate) => set({ programStartDate }),
  toggleFavouriteFood: (id) => set((state) => ({ favouriteFoodIds: state.favouriteFoodIds.includes(String(id)) ? state.favouriteFoodIds.filter((item) => item !== String(id)) : [...state.favouriteFoodIds, String(id)] })),
  toggleReportTile: (tile) => set((state) => ({ reportTiles: state.reportTiles.includes(tile) ? state.reportTiles.filter((item) => item !== tile) : [...state.reportTiles, tile] })),
  setAiPreferences: (aiPreferences) => set({ aiPreferences }),
  clearClientPreferences: () => set((state) => ({ theme: state.theme, targetWeightKg: null, waterGoalMl: null, fastingPreference: 'none', remindersEnabled: false, units: 'metric', programStartDate: null, favouriteFoodIds: [], reportTiles: ['weight', 'calories', 'protein', 'carbs', 'fat', 'fibre', 'water'], aiPreferences: { cuisine_regions: [], meals_per_day: 4, spice_level: 'medium', cooking_time: 'any', budget: 'any', disliked_foods: [], target_weight_kg: null, fasting: 'none' } })),
}), { name: 'smartdiet-prefs' }))

export default usePrefsStore
