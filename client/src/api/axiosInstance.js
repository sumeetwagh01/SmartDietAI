import axios from 'axios'

import useAuthStore from '@/store/authStore'
import { clearPerUserClientData } from '@/utils/session'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'https://smartdietai-q3rr.onrender.com/api/v1'),
  timeout: 90000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadSession = Boolean(useAuthStore.getState().token)
    if (error.response?.status === 401 && hadSession) {
      clearPerUserClientData()
      useAuthStore.getState().clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.replace('/login?reason=session-expired')
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
