// frontend/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // This handles HTTP-only cookies automatically
  timeout: 30000,
});

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    error.message =
      error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(error);
  }
);

export default api;
