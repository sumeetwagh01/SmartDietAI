import axiosInstance from './axiosInstance'

export const getTargets = async () =>
  (await axiosInstance.get('/ai-plan/targets')).data

export const generateTargets = async ({ preferences = {}, force = false } = {}) =>
  (await axiosInstance.post('/ai-plan/targets', { preferences, force })).data

export const getTodayAiPlan = async (date) =>
  (await axiosInstance.get('/ai-plan/today', { params: { date } })).data

export const generateAiPlan = async ({ date, preferences = {}, regenerate = false }) =>
  (await axiosInstance.post('/ai-plan/meal-plan', { date, preferences, regenerate })).data

