import axiosInstance from './axiosInstance'

export const generatePlan = async () =>
  (await axiosInstance.post('/meal-plan/generate')).data

export const getTodayPlan = async () =>
  (await axiosInstance.get('/meal-plan/today')).data

export const getHistory = async () =>
  (await axiosInstance.get('/meal-plan/history')).data
