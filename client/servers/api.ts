// services/axiosInstance.ts

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const axiosInstance = axios.create({
  baseURL: "http://172.20.10.4:5000",
  timeout: 10000, // Set timeout as needed
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
