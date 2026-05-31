require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-service' })
})

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı')
    app.listen(process.env.PORT, () => {
      console.log(`Auth Service çalışıyor: http://localhost:${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB bağlantı hatası:', err.message)
    process.exit(1)
  })