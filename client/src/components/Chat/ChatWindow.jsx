import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getChatSocket } from '../../services/socket'
import api from '../../services/api'
import MessageInput from './MessageInput'

export default function ChatWindow({ conversation }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!conversation) return

    const socket = getChatSocket()
    socket.emit('conversation:join', conversation._id)

    // Geçmiş mesajları yükle
    setLoading(true)
    api.get(`/chat/conversations/${conversation._id}/messages`)
      .then(res => {
        setMessages(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    socket.on('message:receive', (msg) => {
      setMessages(prev => {
        // Aynı mesaj zaten varsa ekleme
        if (prev.find(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      if (msg.sender !== user._id) {
        socket.emit('message:seen', {
          messageId: msg._id,
          conversationId: conversation._id
        })
      }
    })

    socket.on('message:status', ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, status } : m)
      )
    })

    socket.on('typing:start', ({ userId }) => {
      if (userId !== user._id) setTyping(true)
    })

    socket.on('typing:stop', ({ userId }) => {
      if (userId !== user._id) setTyping(false)
    })

    return () => {
      socket.off('message:receive')
      socket.off('message:status')
      socket.off('typing:start')
      socket.off('typing:stop')
    }
  }, [conversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div style={styles.empty}>
        <p>Bir konuşma seç veya yeni konuşma başlat</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <strong>{conversation.name || 'Konuşma'}</strong>
      </div>
      <div style={styles.messages}>
        {loading && <p style={{ textAlign: 'center', color: '#9ca3af' }}>Yükleniyor...</p>}
        {messages.map((msg, i) => {
          const isMine = msg.sender === user._id
          return (
            <div key={i} style={{ ...styles.msgRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.bubble, background: isMine ? '#4f46e5' : '#f3f4f6', color: isMine ? '#fff' : '#1f2937' }}>
                <p style={styles.msgText}>{msg.content}</p>
                <span style={styles.status}>
                  {isMine && (msg.status === 'seen' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓')}
                </span>
              </div>
            </div>
          )
        })}
        {typing && (
          <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, background: '#f3f4f6', color: '#9ca3af' }}>
              yazıyor...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput conversationId={conversation._id} />
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, height: '100vh' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  header: { padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#fff' },
  messages: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  msgRow: { display: 'flex' },
  bubble: { maxWidth: '65%', padding: '0.6rem 1rem', borderRadius: '16px' },
  msgText: { margin: 0, fontSize: '15px' },
  status: { fontSize: '11px', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '2px' }
}