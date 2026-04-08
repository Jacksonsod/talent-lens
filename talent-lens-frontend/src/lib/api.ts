import axios from "axios";

/**
 * Configure our primary HTTP client.
 * Axios intercepts allow us to inject Auth tokens globally without repetitive logic.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

// ─── Request Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Automatically intercept Auth failures across the entire app
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Prevent infinite loops if multiple requests fail simultaneously
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
