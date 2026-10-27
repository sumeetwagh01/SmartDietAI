import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAiPlanStore = create(persist((set) => ({
  targets: null,
  stale: false,
  plans: {},
  setTargets: (targets, stale = false) => set({ targets, stale }),
  setStale: (stale = true) => set({ stale }),
  setPlan: (date, plan) => set((state) => ({ plans: { ...state.plans, [date]: plan } })),
  removePlan: (date) => set((state) => {
    const plans = { ...state.plans }
    delete plans[date]
    return { plans }
  }),
  clearAiData: () => set({ targets: null, stale: false, plans: {} }),
}), { name: 'smartdiet-ai' }))

export default useAiPlanStore

