import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      lastUserUid: null,
      setAuth: (user, token) => set((state) => ({ user, token, isLoggedIn: true, lastUserUid: user?.uid || state.lastUserUid })),
      clearAuth: () => set({ user: null, token: null, isLoggedIn: false }),
    }),
    { name: 'smartdiet-auth' },
  ),
)

export default useAuthStore
