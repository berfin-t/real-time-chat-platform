const { createClient } = require('redis')

let publisher
const initRedis = async () => {
  publisher = createClient({ url: process.env.REDIS_URL })
  await publisher.connect()
  console.log('Redis publisher bağlandı')
}
initRedis()

const jwt = require('jsonwebtoken')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')

const onlineUsers = new Map()

module.exports = (io) => {

  // JWT doğrulama middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Token bulunamadı'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.userId
      next()
    } catch {
      next(new Error('Geçersiz token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    console.log(`Kullanıcı bağlandı: ${userId}`)

    // Kullanıcıyı online yap
    onlineUsers.set(userId, socket.id)
    io.emit('user:online', { userId, isOnline: true })

    // Kendi odasına gir (direkt mesaj almak için)
    socket.join(userId)

    // Konuşma odasına katıl
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId)
      console.log(`${userId} odaya katıldı: ${conversationId}`)
    })

    // Mesaj gönder
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, senderUsername } = data

        // Konuşma var mı kontrol et
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          socket.emit('error', { message: 'Konuşma bulunamadı' })
          return
        }

        // Mesajı kaydet
        const message = await Message.create({
          conversationId,
          sender: userId,
          content,
          status: 'sent'
        })

        // Konuşmanın son mesajını güncelle
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date()
        })

        // Odadakilere mesajı gönder
        io.to(conversationId).emit('message:receive', {
          _id: message._id,
          conversationId,
          sender: userId,
          content,
          status: 'sent',
          createdAt: message.createdAt
        })

        // Notification Service'e bildir
if (publisher) {
  conversation.participants.forEach((participantId) => {
    const pid = participantId.toString()
    if (pid !== userId) {
      publisher.publish('chat:events', JSON.stringify({
        type: 'new_message',
        data: {
          recipientId: pid,
          senderId: userId,
          senderUsername: senderUsername || 'Bilinmeyen',
          content,
          conversationId
        }
      }))
    }
  })
}

        // Delivered durumuna geç — karşı taraf online mı?
        conversation.participants.forEach(async (participantId) => {
          const pid = participantId.toString()
          if (pid !== userId && onlineUsers.has(pid)) {
            await Message.findByIdAndUpdate(message._id, { status: 'delivered' })
            io.to(conversationId).emit('message:status', {
              messageId: message._id,
              status: 'delivered'
            })
          }
        })

      } catch (error) {
        console.error('Mesaj gönderme hatası:', error)
        socket.emit('error', { message: 'Mesaj gönderilemedi' })
      }
    })

    // Mesaj görüldü
    socket.on('message:seen', async (data) => {
      try {
        const { messageId, conversationId } = data

        await Message.findByIdAndUpdate(messageId, {
          status: 'seen',
          $addToSet: { seenBy: userId }
        })

        io.to(conversationId).emit('message:status', {
          messageId,
          status: 'seen',
          seenBy: userId
        })
      } catch (error) {
        console.error('Seen hatası:', error)
      }
    })

    // Typing indicator
    socket.on('typing:start', (data) => {
      socket.to(data.conversationId).emit('typing:start', {
        userId,
        conversationId: data.conversationId
      })
    })

    socket.on('typing:stop', (data) => {
      socket.to(data.conversationId).emit('typing:stop', {
        userId,
        conversationId: data.conversationId
      })
    })

    // Konuşma oluştur
    socket.on('conversation:create', async (data) => {
      try {
        const { participantId } = data

        // Zaten var mı?
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, participantId] }
        })

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, participantId]
          })
        }

        socket.join(conversation._id.toString())
        socket.emit('conversation:created', conversation)

      } catch (error) {
        console.error('Konuşma oluşturma hatası:', error)
        socket.emit('error', { message: 'Konuşma oluşturulamadı' })
      }
    })

    // Bağlantı koptu
    socket.on('disconnect', () => {
      console.log(`Kullanıcı ayrıldı: ${userId}`)
      onlineUsers.delete(userId)
      io.emit('user:online', { userId, isOnline: false })
    })
  })
}