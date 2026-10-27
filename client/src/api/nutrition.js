import axiosInstance from './axiosInstance'

export const searchFood = async (query) =>
  (await axiosInstance.get('/nutrition/search', { params: { q: query } })).data

export const getFood = async (id) =>
  (await axiosInstance.get(`/nutrition/food/${id}`)).data
