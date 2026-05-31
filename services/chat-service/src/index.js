require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const Conversation = require('./models/Conversation')
const Message = require('./models/Message')
const User = require('./models/User')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

// Socket handler
require('./socket/chatHandler')(io)

// Kullanıcı adı ile kullanıcı ara
app.get('/users/search/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      username: { $regex: req.params.username, $options: 'i' }
    })
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// REST — konuşma geçmişi getir
app.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort({ createdAt: 1 }).limit(50)
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// REST — kullanıcının konuşmalarını getir
app.get('/conversations/user/:userId', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.params.userId
    })
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 })
    res.json(conversations)
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'chat-service' })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı')
    server.listen(3002, '0.0.0.0', () => {
      console.log('Chat Service çalışıyor: http://localhost:3002')
    })
  })
  .catch((err) => {
    console.error('MongoDB bağlantı hatası:', err.message)
    process.exit(1)
  })