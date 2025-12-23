import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Session management utilities
const SESSION_STORAGE_KEYS = {
  TOKEN: 'cafe_token',
  SESSION_ID: 'cafe_session_id',
  USER: 'cafe_user',
  LAST_ROUTE: 'cafe_last_route',
  LOGIN_TIME: 'cafe_login_time'
};

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const saveSession = (user, token) => {
  const sessionId = generateSessionId();
  const loginTime = Date.now();
  
  localStorage.setItem(SESSION_STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(SESSION_STORAGE_KEYS.SESSION_ID, sessionId);
  localStorage.setItem(SESSION_STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(SESSION_STORAGE_KEYS.LOGIN_TIME, loginTime.toString());
  localStorage.setItem('userName', user.name || user.username || 'Staff');
  
  return { sessionId, loginTime };
};

const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(SESSION_STORAGE_KEYS.USER);
  localStorage.removeItem(SESSION_STORAGE_KEYS.LOGIN_TIME);
  localStorage.removeItem(SESSION_STORAGE_KEYS.LAST_ROUTE);
  localStorage.removeItem('userName');
  localStorage.removeItem('branchName');
  localStorage.removeItem('branchId');
};

const restoreSession = () => {
  const token = localStorage.getItem(SESSION_STORAGE_KEYS.TOKEN);
  const sessionId = localStorage.getItem(SESSION_STORAGE_KEYS.SESSION_ID);
  const userStr = localStorage.getItem(SESSION_STORAGE_KEYS.USER);
  
  if (token && sessionId && userStr) {
    try {
      const user = JSON.parse(userStr);
      return { token, sessionId, user };
    } catch (e) {
      clearSession();
      return null;
    }
  }
  return null;
};

const saveLastRoute = (route) => {
  localStorage.setItem(SESSION_STORAGE_KEYS.LAST_ROUTE, route);
};

const getLastRoute = () => {
  return localStorage.getItem(SESSION_STORAGE_KEYS.LAST_ROUTE);
};

// Configure axios to always send credentials
axios.defaults.withCredentials = true;

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
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
          localStorage.setItem(SESSION_STORAGE_KEYS.TOKEN, newToken);
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
                const newToken = localStorage.getItem(SESSION_STORAGE_KEYS.TOKEN);
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
            const { token: newToken, user: updatedUser } = res.data;
            
            console.log('[AuthContext] Token refreshed successfully');
            
            // Update session with new token
            if (updatedUser) {
              saveSession(updatedUser, newToken);
              setUser(updatedUser);
            } else {
              localStorage.setItem(SESSION_STORAGE_KEYS.TOKEN, newToken);
            }
            
            setToken(newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Notify all queued requests
            refreshSubscribersRef.current.forEach(callback => callback());
            refreshSubscribersRef.current = [];
            
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('[AuthContext] Refresh failed:', refreshError.response?.status, refreshError.response?.data?.message);
            // Refresh failed, clear auth state
            clearSession();
            setUser(null);
            setToken(null);
            setSessionId(null);
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
      localStorage.setItem(SESSION_STORAGE_KEYS.TOKEN, token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem(SESSION_STORAGE_KEYS.TOKEN);
    }
  }, [token]);

  // Check for existing session on mount
  useEffect(() => {
    const restoreSessionAndVerify = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      try {
        // Try to restore session from localStorage
        const session = restoreSession();
        
        if (session) {
          console.log('[AuthContext] Session found, attempting to restore...');
          // Session found, restore it
          const { token: savedToken, sessionId: savedSessionId, user: savedUser } = session;
          
          // Set token in axios BEFORE making any requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          setToken(savedToken);
          setSessionId(savedSessionId);
          
          // Verify the token is still valid with the saved user data first
          setUser(savedUser);
          
          // Then verify with backend
          try {
            console.log('[AuthContext] Verifying token with backend...');
            const res = await axios.get(`${API_URL}/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            console.log('[AuthContext] Session verified successfully:', res.data);
            setUser(res.data);
            setLoading(false);
            return;
          } catch (err) {
            console.log('[AuthContext] Token verification failed, attempting refresh...');
            
            // Token might be expired, try to refresh it
            try {
              const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
                withCredentials: true
              });
              
              if (refreshRes.data && refreshRes.data.token) {
                console.log('[AuthContext] Token refreshed successfully');
                const newToken = refreshRes.data.token;
                saveSession(savedUser, newToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                setToken(newToken);
                setSessionId(localStorage.getItem(SESSION_STORAGE_KEYS.SESSION_ID));
                setUser(savedUser);
                setLoading(false);
                return;
              }
            } catch (refreshErr) {
              console.log('[AuthContext] Token refresh failed:', refreshErr.message);
            }
            
            // Both verification and refresh failed, clear session
            console.log('[AuthContext] Clearing invalid session');
            clearSession();
            setUser(null);
            setToken(null);
            setSessionId(null);
          }
        } else {
          console.log('[AuthContext] No saved session found');
          // No saved session
          setUser(null);
          setToken(null);
          setSessionId(null);
        }
      } catch (err) {
        console.error('[AuthContext] Session restore failed:', err);
        clearSession();
        setUser(null);
        setToken(null);
        setSessionId(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSessionAndVerify();
  }, []);

  const login = async (credentials, type = 'branch') => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = type === 'admin' ? '/api/auth/admin/login' : '/api/auth/branch/login';
      
      const res = await axios.post(`${API_URL}${endpoint}`, credentials, { withCredentials: true });
      
      const { token: newToken, ...userData } = res.data;
      
      // Save session to localStorage with session ID
      saveSession(userData, newToken);
      
      setToken(newToken);
      setUser(userData);
      setSessionId(localStorage.getItem(SESSION_STORAGE_KEYS.SESSION_ID));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
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
    
    // Clear all session data
    clearSession();
    setUser(null);
    setToken(null);
    setSessionId(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    sessionId,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    saveLastRoute,
    getLastRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
