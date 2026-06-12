import axios from "axios";

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getDietRecommendations = (userId) => API.get(`/api/diet/recommend/${userId}`);
export const detectAllergen = (foodName) => API.post("/api/allergen/detect", { name: foodName });
export const getNutrients = (mealId) => API.get(`/api/analytics/nutrients/${mealId}`);

export default API;
