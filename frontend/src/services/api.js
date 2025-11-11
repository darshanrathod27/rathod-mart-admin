// frontend/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // This is correct, keep it
  timeout: 30000,
});

// request: remove the manual token interceptor
api.interceptors.request.use((config) => {
  // const token = sessionStorage.getItem("token"); // <-- REMOVE
  // if (token) config.headers.Authorization = `Bearer ${token}`; // <-- REMOVE
  config.params = { ...(config.params || {}), _t: Date.now() };
  return config;
});

// response: (This is fine, keep it)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    error.message =
      error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(error);
  }
);

export default api;
