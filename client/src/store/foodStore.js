import { create } from 'zustand'

const today = new Date().toISOString().slice(0, 10)

const useFoodStore = create((set) => ({
  todayLogs: [],
  selectedDate: today,
  setLogs: (todayLogs) => set({ todayLogs }),
  addLog: (log) => set((state) => ({ todayLogs: [...state.todayLogs, log] })),
  removeLog: (index) =>
    set((state) => ({
      todayLogs: state.todayLogs.filter((_, itemIndex) => itemIndex !== index),
    })),
  setDate: (selectedDate) => set({ selectedDate, todayLogs: [] }),
}))

export default useFoodStore
