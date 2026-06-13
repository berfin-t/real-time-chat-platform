import { useState, useRef } from 'react'
import { getChatSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState('')
  const typingTimeout = useRef(null)
  const socket = getChatSocket()
  const { user } = useAuth()

  const handleChange = (e) => {
    setText(e.target.value)
    socket.emit('typing:start', { conversationId })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId })
    }, 1500)
  }

  const handleSend = () => {
    if (!text.trim()) return
    socket.emit('message:send', {
      conversationId,
      content: text.trim(),
      senderUsername: user.username
    })
    socket.emit('typing:stop', { conversationId })
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        type="text"
        placeholder="Mesaj yaz..."
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button style={styles.button} onClick={handleSend}>
        Gönder
      </button>
    </div>
  )
}

const styles = {
  container: { display: 'flex', gap: '8px', padding: '1rem', borderTop: '1px solid #e5e7eb', background: '#fff' },
  input: { flex: 1, padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: '24px', fontSize: '15px', outline: 'none' },
  button: { padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 500 }
}