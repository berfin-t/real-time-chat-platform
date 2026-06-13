import { io } from 'socket.io-client'
 
let chatSocket = null
let notificationSocket = null

export const connectChatSocket = (token) => {
    if(chatSocket) chatSocket.disconnect()
    chatSocket = io('http://localhost:3002', {
        auth: {
            token
        }
    })
    return chatSocket
}

export const connectNotificationSocket = (token) => {
  if (notificationSocket) notificationSocket.disconnect()
  notificationSocket = io('http://localhost:3003', {
    auth: { token }
  })
  return notificationSocket
}

export const getChatSocket = () => chatSocket
export const getNotificationSocket = () => notificationSocket

export const disconnectSockets = () => {
    if (chatSocket) chatSocket.disconnect()
    if (notificationSocket) notificationSocket.disconnect()
    chatSocket = null
    notificationSocket = null
}
