import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000", // Base URL without the /api prefix since we'll add it in the requests
  withCredentials: true, // Include cookies in cross-site requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
