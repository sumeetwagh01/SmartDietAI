import axiosInstance from './axiosInstance'

export const logFood = async (data) =>
  (await axiosInstance.post('/food-log/', data)).data

export const getFoodLog = async (dateStr) =>
  (await axiosInstance.get(`/food-log/${dateStr}`)).data

export const deleteEntry = async (dateStr, index) =>
  (await axiosInstance.delete(`/food-log/${dateStr}/${index}`)).data
