import axiosInstance from './axiosInstance'

export const sendMessage = async (message, history) =>
  (await axiosInstance.post('/ai/chat', { message, history })).data

export const getSuggestions = async () =>
  (await axiosInstance.get('/ai/suggestions')).data
