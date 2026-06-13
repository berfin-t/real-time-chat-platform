import { createContext, useContext, useEffect, useState } from 'react'
import { getChatSocket, getNotificationSocket } from '../services/socket'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return

    const chatSocket = getChatSocket()
    const notifSocket = getNotificationSocket()

    chatSocket?.off('user:online')
    notifSocket?.off('notifications:list')
    notifSocket?.off('notification:new')
    
    if (chatSocket) {
      chatSocket.on('user:online', ({ userId, isOnline }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          isOnline ? next.add(userId) : next.delete(userId)
          return next
        })
      })
    }

    if (notifSocket) {
      notifSocket.emit('notifications:get')
      notifSocket.on('notifications:list', (list) => setNotifications(list))
      notifSocket.on('notification:new', (notif) => {
        setNotifications(prev => [notif, ...prev])
      })
    }

    return () => {
      chatSocket?.off('user:online')
      notifSocket?.off('notifications:list')
      notifSocket?.off('notification:new')
    }
  }, [user])

  const markAllRead = () => {
    const notifSocket = getNotificationSocket()
    notifSocket?.emit('notifications:readAll')
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <SocketContext.Provider value={{ onlineUsers, notifications, markAllRead, setNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)