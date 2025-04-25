// src/api/axios.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://travel-buddy-7g6f.onrender.com/api/", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Authorization header dynamically
axiosInstance.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem("authTokens"));
  if (tokens && tokens.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

export default axiosInstance;


