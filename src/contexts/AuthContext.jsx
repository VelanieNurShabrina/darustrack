import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      console.log('Login API Response:', response)

      if (response && response.accessToken) {
        // Store token in localStorage
        localStorage.setItem('token', response.accessToken)

        // Extract user info from token
        const tokenPayload = JSON.parse(atob(response.accessToken.split('.')[1]))
        const user = {
          id: tokenPayload.id,
          name: tokenPayload.name,
          role: tokenPayload.role
        }

        localStorage.setItem('user', JSON.stringify(user))
        setCurrentUser(user)
        setUserRole(user.role)
        return user
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Login failed')
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      setError(null); // Clear previous errors
      console.log('Attempting to refresh token...');
      const response = await authAPI.refreshToken(); // Assuming authAPI has a refreshToken method
      console.log('Refresh Token API Response:', response);

      if (response && response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        console.log('Token refreshed successfully.');

        // Optional: Re-decode token if user info might change upon refresh
        // const tokenPayload = JSON.parse(atob(response.accessToken.split('.')[1]));
        // const user = {
        //   id: tokenPayload.id,
        //   name: tokenPayload.name,
        //   role: tokenPayload.role
        // };
        // localStorage.setItem('user', JSON.stringify(user));
        // setCurrentUser(user);
        // setUserRole(user.role);

        return true; // Indicate success
      } else {
        throw new Error('Invalid response from refresh token endpoint');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setError(error.response?.data?.message || error.message || 'Failed to refresh token');
      // Optional: Handle refresh failure, e.g., force logout
      // logout();
      throw error; // Re-throw error for caller to handle if needed
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setCurrentUser(null)
      setUserRole(null)
    }
  }

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))

    if (token && user) {
      setCurrentUser(user)
      setUserRole(user.role)
    }
    setLoading(false)
  }, [])

  const value = {
    currentUser,
    userRole,
    login,
    refreshToken,
    logout,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
