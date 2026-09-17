import axiosInstance from './axiosInstance'

export const getProgress = async (fromDate, toDate) =>
  (
    await axiosInstance.get('/progress/', {
      params: { from_date: fromDate, to_date: toDate },
    })
  ).data

export const addWeight = async (weightKg, date) =>
  (await axiosInstance.post('/progress/weight', { weight_kg: weightKg, date })).data

export const getWeightHistory = async () =>
  (await axiosInstance.get('/progress/weight')).data
