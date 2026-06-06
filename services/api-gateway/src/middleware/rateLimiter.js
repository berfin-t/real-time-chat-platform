const rateLimit = require('express-rate-limit')

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Çok fazla istek gönderdiniz, lütfen bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Çok fazla giriş denemesi, lütfen bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { globalLimiter, authLimiter }