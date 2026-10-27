import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useWellnessStore = create(persist((set) => ({
  waterMl: 0,
  waterByDate: {},
  waterActionsByDate: {},
  fastingStartedAt: null,
  fastingPlan: '16:8',
  completedFasts: [],
  groceryTicks: {},
  cycleStart: null,
  mealAssignments: {},
  addWater: (dateOrAmount, maybeAmount) => set((state) => {
    const legacy = typeof dateOrAmount === 'number'
    const date = legacy ? new Date().toISOString().slice(0, 10) : dateOrAmount
    const amount = legacy ? dateOrAmount : maybeAmount
    const current = state.waterByDate[date] || 0
    return { waterMl: date === new Date().toISOString().slice(0, 10) ? current + amount : state.waterMl, waterByDate: { ...state.waterByDate, [date]: current + amount }, waterActionsByDate: { ...state.waterActionsByDate, [date]: [...(state.waterActionsByDate[date] || []), amount] } }
  }),
  undoWater: (date) => set((state) => {
    const actions = [...(state.waterActionsByDate[date] || [])]
    const amount = actions.pop()
    if (!amount) return state
    const next = Math.max(0, (state.waterByDate[date] || 0) - amount)
    return { waterMl: date === new Date().toISOString().slice(0, 10) ? next : state.waterMl, waterByDate: { ...state.waterByDate, [date]: next }, waterActionsByDate: { ...state.waterActionsByDate, [date]: actions } }
  }),
  resetWater: (date = new Date().toISOString().slice(0, 10)) => set((state) => ({ waterByDate: { ...state.waterByDate, [date]: 0 }, waterActionsByDate: { ...state.waterActionsByDate, [date]: [] }, waterMl: date === new Date().toISOString().slice(0, 10) ? 0 : state.waterMl })),
  setFastingPlan: (fastingPlan) => set({ fastingPlan }),
  startFast: () => set({ fastingStartedAt: new Date().toISOString() }),
  endFast: () => set((state) => state.fastingStartedAt ? ({ fastingStartedAt: null, completedFasts: [...state.completedFasts, { started_at: state.fastingStartedAt, ended_at: new Date().toISOString(), plan: state.fastingPlan }] }) : state),
  setFastingStartedAt: (fastingStartedAt) => set({ fastingStartedAt }),
  setMealAssignments: (date, assignments) => set((state) => ({ mealAssignments: { ...state.mealAssignments, [date]: assignments } })),
  removeMealAssignment: (date, index) => set((state) => ({ mealAssignments: { ...state.mealAssignments, [date]: (state.mealAssignments[date] || []).filter((_, itemIndex) => itemIndex !== index) } })),
  toggleGrocery: (id) => set((state) => ({ groceryTicks: { ...state.groceryTicks, [id]: !state.groceryTicks[id] } })),
  setCycleStart: (cycleStart) => set({ cycleStart }),
  clearWellness: () => set({ waterMl: 0, waterByDate: {}, waterActionsByDate: {}, fastingStartedAt: null, fastingPlan: '16:8', completedFasts: [], groceryTicks: {}, cycleStart: null, mealAssignments: {} }),
}), { name: 'smartdiet-wellness' }))

export default useWellnessStore
