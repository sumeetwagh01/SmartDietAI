import axiosInstance from './axiosInstance'

export const login = async (email, password) =>
  (await axiosInstance.post('/auth/login', { email, password })).data

export const register = async (name, email, password) =>
  (await axiosInstance.post('/auth/register', { name, email, password })).data

export const getMe = async () => (await axiosInstance.get('/auth/me')).data

export const updateMe = async (data) =>
  (await axiosInstance.put('/auth/me', data)).data
