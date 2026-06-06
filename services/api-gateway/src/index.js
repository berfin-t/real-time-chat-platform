require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter')
const authMiddleware = require('./middleware/auth')

const app = express()

app.use(cors())
app.use(globalLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' })
})

// Auth Service — public
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true
})

app.use('/api/auth/register', authLimiter, (req, res, next) => {
  req.url = '/auth/register'
  authProxy(req, res, next)
})

app.use('/api/auth/login', authLimiter, (req, res, next) => {
  req.url = '/auth/login'
  authProxy(req, res, next)
})

app.use('/api/auth/me', authMiddleware, (req, res, next) => {
  req.url = '/auth/me'
  authProxy(req, res, next)
})

app.use('/api/auth/logout', authMiddleware, (req, res, next) => {
  req.url = '/auth/logout'
  authProxy(req, res, next)
})

// Chat Service — protected
const chatProxy = createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL,
  changeOrigin: true
})

app.use('/api/users/search', authMiddleware, (req, res, next) => {
  req.url = '/users/search' + req.url.replace('/api/users/search', '')
  chatProxy(req, res, next)
})

app.use('/api/chat', authMiddleware, (req, res, next) => {
  req.url = req.url.replace('/api/chat', '')
  chatProxy(req, res, next)
})

// Notification Service — protected
const notificationProxy = createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true
})

app.use('/api/notifications', authMiddleware, (req, res, next) => {
  req.url = '/notifications' + req.url.replace('/api/notifications', '')
  notificationProxy(req, res, next)
})

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route bulunamadı' })
})

app.listen(3000, '0.0.0.0', () => {
  console.log('API Gateway çalışıyor: http://localhost:3000')
})