// src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000,
});

// request: add token + no-cache param
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.params = { ...(config.params || {}), _t: Date.now() };
  return config;
});

// response: keep the original axios error so callers can read response safely
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // attach a friendlier message but keep original structure
    error.message =
      error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(error);
  }
);

export default api;
