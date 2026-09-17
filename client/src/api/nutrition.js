import axiosInstance from './axiosInstance'

export const searchFood = async (query) =>
  (await axiosInstance.get('/nutrition/search', { params: { q: query } })).data
