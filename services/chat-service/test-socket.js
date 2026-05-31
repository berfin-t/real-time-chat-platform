const { io } = require('socket.io-client')

// Önce auth servisinden token al
const fetch = require('node:http')

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}

const body = JSON.stringify({ email: 'test1@test.com', password: '123456' })

const req = fetch.request(options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Ham response:', data)  
    const { token, user } = JSON.parse(data)
    
    // Token payload'ını gör
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    console.log('Token payload:', payload)
    console.log('User objesi:', user)
    
    console.log('Token alındı, socket bağlanıyor...')

    const socket = io('http://localhost:3002', {
      auth: { token },
         extraHeaders: {
    authorization: `Bearer ${token}`
  }
    })

    socket.on('connect', () => {
      console.log('Socket bağlandı! ID:', socket.id)

      // Konuşma oluştur
      socket.emit('conversation:create', { participantId: user._id })
    })

    socket.on('conversation:created', (conversation) => {
      console.log('Konuşma oluşturuldu:', conversation._id)

      // Mesaj gönder
      socket.emit('message:send', {
        conversationId: conversation._id,
        content: 'Merhaba, bu bir test mesajıdır!'
      })
    })

    socket.on('message:receive', (message) => {
      console.log('Mesaj alındı:', message.content)
      console.log('Durum:', message.status)
      socket.disconnect()
      process.exit(0)
    })

    socket.on('connect_error', (err) => {
      console.error('Bağlantı hatası:', err.message)
      process.exit(1)
    })
  })
})

req.write(body)
req.end()