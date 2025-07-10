// src/utils/axiosInstance.jsx
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/', // Change this to match your FastAPI backend URL
  timeout: 10000,
});

// Add a request interceptor to include token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Handle 401/403 responses globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout for authentication errors, not permission errors
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    // For 403 (Forbidden), let the component handle it gracefully
    return Promise.reject(error);
  }
);
const api = axios.create({
  baseURL: "http://localhost:8000", // or your backend URL
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default axiosInstance;
