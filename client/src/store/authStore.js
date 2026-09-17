import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      setAuth: (user, token) => set({ user, token, isLoggedIn: true }),
      clearAuth: () => set({ user: null, token: null, isLoggedIn: false }),
    }),
    { name: 'smartdiet-auth' },
  ),
)

export default useAuthStore
