import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import socketClient from '../services/socket.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bol_tortlari_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    const storedToken = localStorage.getItem('bol_tortlari_token');
    if (storedToken) {
      try {
        const res = await authApi.getMe();
        setUser(res.data.user);
        socketClient.connect();
      } catch (error) {
        console.warn('Token expired or invalid');
        localStorage.removeItem('bol_tortlari_token');
        setToken(null);
        setUser(null);
        socketClient.disconnect();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      socketClient.disconnect();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('bol_tortlari_token', newToken);
    setToken(newToken);
    setUser(userData);
    socketClient.connect();
    return userData;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await authApi.verifyEmail(email, code);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('bol_tortlari_token', newToken);
    setToken(newToken);
    setUser(userData);
    socketClient.connect();
    return userData;
  };

  const resendCode = async (email) => {
    const res = await authApi.resendCode(email);
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await authApi.forgotPassword(email);
    return res.data;
  };

  const verifyResetCode = async (email, code) => {
    const res = await authApi.verifyResetCode(email, code);
    return res.data;
  };

  const resetPassword = async (email, code, newPassword, confirmPassword) => {
    const res = await authApi.resetPassword(email, code, newPassword, confirmPassword);
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const res = await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
    return res.data;
  };

  const loginWithToken = async (newToken) => {
    localStorage.setItem('bol_tortlari_token', newToken);
    setToken(newToken);
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
      socketClient.connect();
      return res.data.user;
    } catch (err) {
      console.error('Failed to load user with token', err);
      localStorage.removeItem('bol_tortlari_token');
      setToken(null);
      setUser(null);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
    } catch (e) {}
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('bol_tortlari_token');
    setToken(null);
    setUser(null);
    socketClient.disconnect();
  };

  const isAdmin = ['superadmin', 'super_admin', 'admin'].includes(user?.role);
  const isSuperAdmin = ['superadmin', 'super_admin'].includes(user?.role);
  const isConfectioner = user?.role === 'confectioner';
  const isCourier = user?.role === 'courier';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isConfectioner,
        isCourier,
        login,
        loginWithToken,
        register,
        verifyEmail,
        resendCode,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        updateProfile,
        changePassword,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
