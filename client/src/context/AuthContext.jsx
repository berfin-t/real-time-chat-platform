import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { connectChatSocket, connectNotificationSocket, disconnectSockets } from '../services/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
      connectChatSocket(token)
      connectNotificationSocket(token)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    connectChatSocket(token)
    connectNotificationSocket(token)
    return user
  }

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    connectChatSocket(token)
    connectNotificationSocket(token)
    return user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      disconnectSockets()
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)