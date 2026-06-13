import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getChatSocket } from '../services/socket'
import api from '../services/api'
import ChatList from '../components/Chat/ChatList'
import ChatWindow from '../components/Chat/ChatWindow'
import NotificationBell from '../components/Notification/NotificationBell'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [searchUsername, setSearchUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // Bildirimden gelen conversationId'yi işle
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (!conversationId) return

    const existing = conversations.find(c => c._id === conversationId)
    if (existing) {
      setActiveConv(existing)
      return
    }

    // Listede yoksa backend'den getir
    api.get(`/conversations/${conversationId}`)
      .then(res => {
        const conv = res.data
        setConversations(prev => {
          const exists = prev.find(c => c._id === conv._id)
          if (exists) return prev
          return [conv, ...prev]
        })
        setActiveConv(conv)
      })
      .catch(err => console.error('Konuşma yüklenemedi:', err))
  }, [searchParams, conversations])

  const openConversationById = (conversationId) => {
    const existing = conversations.find(c => c._id === conversationId)
    if (existing) {
      setActiveConv(existing)
      return
    }
    const socket = getChatSocket()
    socket.emit('conversation:join', conversationId)
    setActiveConv({ _id: conversationId, name: 'Konuşma' })
  }

  const startConversation = async () => {
    if (!searchUsername.trim()) return
    setSearching(true)
    setSearchError('')

    try {
      const res = await api.get(`/users/search/${searchUsername.trim()}`)
      const foundUser = res.data

      if (foundUser._id === user._id) {
        setSearchError('Kendinizle chat başlatamazsınız')
        setSearching(false)
        return
      }

      const socket = getChatSocket()
      socket.emit('conversation:create', { participantId: foundUser._id })
      socket.once('conversation:created', (conv) => {
        conv.name = foundUser.username
        setConversations(prev => {
          const exists = prev.find(c => c._id === conv._id)
          if (exists) return prev
          return [conv, ...prev]
        })
        setActiveConv({ ...conv, name: foundUser.username })
        setSearchUsername('')
      })
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Kullanıcı bulunamadı')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') startConversation()
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.userBar}>
          <span style={styles.username}>👤 {user?.username}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell onOpenConversation={openConversationById} />
            <button style={styles.logoutBtn} onClick={logout}>Çıkış</button>
          </div>
        </div>
        <div style={styles.newChat}>
          <input
            style={styles.newInput}
            placeholder="Kullanıcı adı ara..."
            value={searchUsername}
            onChange={e => { setSearchUsername(e.target.value); setSearchError('') }}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.newBtn} onClick={startConversation} disabled={searching}>
            {searching ? '...' : '+'}
          </button>
        </div>
        {searchError && (
          <div style={styles.searchError}>{searchError}</div>
        )}
        <ChatList
          conversations={conversations}
          activeId={activeConv?._id}
          onSelect={setActiveConv}
        />
      </div>
      <ChatWindow conversation={activeConv} />
    </div>
  )
}

const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: { width: '300px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fff' },
  userBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e5e7eb' },
  username: { fontWeight: 600, fontSize: '15px' },
  logoutBtn: { background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  newChat: { display: 'flex', gap: '8px', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' },
  newInput: { flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' },
  newBtn: { padding: '0.5rem 0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' },
  searchError: { padding: '0.5rem 0.75rem', color: '#ef4444', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }
}