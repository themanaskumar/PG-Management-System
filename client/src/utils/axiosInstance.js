import axios from 'axios';

// CHANGE THIS URL IF NEEDED
const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
  // 1. Get the userInfo object string
  const userInfo = localStorage.getItem('userInfo');

  if (userInfo) {
    try {
      // 2. Parse it to JSON
      const parsedUser = JSON.parse(userInfo);
      
      // 3. Extract the token
      if (parsedUser.token) {
        config.headers.Authorization = `Bearer ${parsedUser.token}`;
      }
    } catch (error) {
      console.error("Error parsing user info:", error);
    }
  }
  
  return config;
}, (error) => Promise.reject(error));

export default api;