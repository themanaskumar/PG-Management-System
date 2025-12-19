import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Local Storage on initial load
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user info:", error);
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  // --- LOGIN FUNCTION ---
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // 2. Save entire user object to state AND local storage
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // --- LOGOUT FUNCTION ---
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    toast.success("Logged out");
    window.location.href = '/login'; // Force redirect
  };

  // --- UPDATE USER FUNCTION (For Profile/Settings updates) ---
  // If you update the user (like profile pic), call this to update state without logging in again
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};