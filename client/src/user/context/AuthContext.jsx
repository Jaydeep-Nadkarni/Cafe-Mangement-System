import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup Axios Interceptors for Token Refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // Check for silent refresh header
        const newToken = response.headers['x-access-token'];
        if (newToken) {
          setToken(newToken);
          localStorage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            // Try to refresh using cookie
            const res = await axios.post(`${API_URL}/api/auth/refresh`);
            const { token: newToken } = res.data;
            
            setToken(newToken);
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check for existing session on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      try {
        // If no token in storage, try to get one via refresh cookie first
        if (!token) {
           try {
             const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`);
             const newToken = refreshRes.data.token;
             setToken(newToken);
             axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
           } catch (e) {
             // No refresh token or invalid
             throw new Error('No session');
           }
        }
        
        // Now fetch user details
        const res = await axios.get(`${API_URL}/api/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.log('Session verification failed:', err.message);
        // Don't call logout() here to avoid infinite loops or unnecessary API calls
        // Just clear state
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (credentials, type = 'branch') => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = type === 'admin' ? '/api/auth/admin/login' : '/api/auth/branch/login';
      
      const res = await axios.post(`${API_URL}${endpoint}`, credentials);
      
      const { token: newToken, ...userData } = res.data;
      
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
