import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'

export default function ChatList({ conversations, activeId, onSelect }) {
  const { onlineUsers } = useSocket()
  const { user } = useAuth()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Konuşmalar</h3>
      </div>
      {conversations.length === 0 && (
        <p style={styles.empty}>Henüz konuşma yok</p>
      )}
      {conversations.map(conv => {
        const otherId = conv.participants.find(p => p !== user._id)
        const isOnline = onlineUsers.has(otherId)
        return (
          <div
            key={conv._id}
            style={{ ...styles.item, background: activeId === conv._id ? '#ede9fe' : 'transparent' }}
            onClick={() => onSelect(conv)}
          >
            <div style={styles.avatar}>
              {conv.name?.[0]?.toUpperCase() || '?'}
              <span style={{ ...styles.dot, background: isOnline ? '#22c55e' : '#d1d5db' }} />
            </div>
            <div style={styles.info}>
              <span style={styles.name}>{conv.name || 'Konuşma'}</span>
              <span style={styles.lastMsg}>
                {conv.lastMessage?.content?.substring(0, 30) || 'Mesaj yok'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  container: { width: '280px', borderRight: '1px solid #e5e7eb', height: '100vh', overflowY: 'auto', background: '#fff' },
  header: { padding: '1rem', borderBottom: '1px solid #e5e7eb' },
  title: { margin: 0, fontSize: '1.1rem', color: '#1f2937' },
  empty: { padding: '1rem', color: '#9ca3af', fontSize: '14px' },
  item: { display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', margin: '4px 8px' },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, position: 'relative', flexShrink: 0 },
  dot: { position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff' },
  info: { marginLeft: '0.75rem', overflow: 'hidden' },
  name: { display: 'block', fontWeight: 500, fontSize: '15px', color: '#1f2937' },
  lastMsg: { display: 'block', fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
}