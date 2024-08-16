// services/axiosInstance.ts

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const axiosInstance = axios.create({
  // baseURL: "http://192.168.43.11:5000",
  baseURL: "https://spassion.onrender.com",
  // timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor if you need to attach tokens
axiosInstance.interceptors.request.use(
  async (config) => {
    // Example: Attach an authorization token
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for logging or error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally if needed
    console.error("API error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
