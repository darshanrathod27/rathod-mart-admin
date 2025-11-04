import axios from "axios";

// Fix environment variable usage and add fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // Increase timeout to 30 seconds
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ API Error: ${url} - Status: ${status} - ${message}`);
    console.error("Full error:", error);

    // Handle different error types
    if (!error.response) {
      // Network error
      console.error("Network Error: Cannot connect to server");
      return Promise.reject(
        new Error(
          "Cannot connect to server. Please check if the backend is running."
        )
      );
    }

    if (status === 401) {
      sessionStorage.removeItem("isAuthenticated");
      sessionStorage.removeItem("token");
      // Don't redirect immediately, let components handle it
      console.warn("Authentication required");
    }

    return Promise.reject(error);
  }
);

export default api;
