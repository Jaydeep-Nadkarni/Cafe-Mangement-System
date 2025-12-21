import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios to always send credentials
axios.defaults.withCredentials = true;

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshSubscribersRef = React.useRef([]);

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
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // Don't retry refresh endpoint itself to prevent infinite loops
        if (originalRequest.url?.includes('/api/auth/refresh')) {
          return Promise.reject(error);
        }
        
        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // If already refreshing, queue this request to retry after refresh
          if (isRefreshing) {
            return new Promise((resolve) => {
              refreshSubscribersRef.current.push(() => {
                const newToken = localStorage.getItem('token');
                if (newToken) {
                  originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                  resolve(axios(originalRequest));
                } else {
                  resolve(Promise.reject(error));
                }
              });
            });
          }
          
          setIsRefreshing(true);
          
          try {
            console.log('[AuthContext] Attempting token refresh...');
            // Try to refresh using cookie
            const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
            const { token: newToken } = res.data;
            
            console.log('[AuthContext] Token refreshed successfully');
            setToken(newToken);
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Notify all queued requests
            refreshSubscribersRef.current.forEach(callback => callback());
            refreshSubscribersRef.current = [];
            
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('[AuthContext] Refresh failed:', refreshError.response?.status, refreshError.response?.data?.message);
            // Refresh failed, clear auth state
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            refreshSubscribersRef.current = [];
            return Promise.reject(refreshError);
          } finally {
            setIsRefreshing(false);
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
        // If we have a token, verify it's still valid
        if (token) {
          const res = await axios.get(`${API_URL}/api/auth/me`);
          setUser(res.data);
        } else {
          // No token and not logged in - just finish loading
          setUser(null);
        }
      } catch (err) {
        console.log('[AuthContext] Session verification failed:', err.message);
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
      
      const res = await axios.post(`${API_URL}${endpoint}`, credentials, { withCredentials: true });
      
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
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
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
