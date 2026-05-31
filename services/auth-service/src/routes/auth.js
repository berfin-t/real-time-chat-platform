const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tüm alanlar zorunlu' })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Bu email veya kullanıcı adı zaten kullanımda' })
    }

    const user = await User.create({ username, email, password })
    const token = generateToken(user._id)

    res.status(201).json({ user, token })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message })
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre zorunlu' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' })
    }

    user.isOnline = true
    await user.save()

    const token = generateToken(user._id)
    res.json({ user, token })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message })
  }
})

// GET /auth/me — token ile kendi bilgilerini getir
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user })
})

// POST /auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    req.user.isOnline = false
    req.user.lastSeen = new Date()
    await req.user.save()
    res.json({ message: 'Çıkış yapıldı' })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

module.exports = router