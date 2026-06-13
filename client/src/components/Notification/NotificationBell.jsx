import { useState, useRef, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import { getChatSocket } from '../../services/socket'

export default function NotificationBell({ onOpenConversation }) {
  const { notifications, markAllRead, setNotifications } = useSocket()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBellClick = () => {
    setOpen(prev => !prev)
  }

  const handleNotificationClick = (notif) => {
    // Bildirimi okundu işaretle
    if (!notif.isRead) {
      const socket = getChatSocket()
      socket?.emit('notification:read', { notificationId: notif._id })
      setNotifications?.(prev =>
        prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
      )
    }

    // İlgili konuşmayı aç
    if (notif.type === 'new_message' && notif.metadata?.conversationId) {
      onOpenConversation?.(notif.metadata.conversationId)
    }

    setOpen(false)
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (notif) => {
    if (notif.type === 'new_message') {
      const sender = notif.metadata?.senderUsername || 'Bir kullanıcı'
      const preview = notif.metadata?.preview || notif.content
      return (
        <>
          <strong>{sender}</strong>
          <span style={styles.preview}>{preview}</span>
        </>
      )
    }
    if (notif.type === 'user_online') {
      return <span>{notif.content}</span>
    }
    if (notif.type === 'user_offline') {
      return <span>{notif.content}</span>
    }
    return <span>{notif.content}</span>
  }

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button style={styles.bell} onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>Bildirimler</span>
            {notifications.length > 0 && (
              <button style={styles.readAllBtn} onClick={markAllRead}>
                Tümünü okundu yap
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 && (
              <div style={styles.empty}>Henüz bildirim yok</div>
            )}
            {notifications.map(notif => (
              <div
                key={notif._id}
                style={{
                  ...styles.item,
                  background: notif.isRead ? '#fff' : '#f5f3ff'
                }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div style={styles.avatar}>
                  {(notif.metadata?.senderUsername || '?')[0]?.toUpperCase()}
                </div>
                <div style={styles.content}>
                  <div style={styles.text}>{renderContent(notif)}</div>
                  <span style={styles.time}>{formatTime(notif.createdAt)}</span>
                </div>
                {!notif.isRead && <div style={styles.unreadDot} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { position: 'relative' },
  bell: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', padding: '4px' },
  badge: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: '-150px', width: '340px', maxHeight: '420px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', zIndex: 100 },  headerTitle: { fontWeight: 600, fontSize: '15px', color: '#1f2937' },
  readAllBtn: { background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', cursor: 'pointer', fontWeight: 500 },
  list: { overflowY: 'auto', maxHeight: '360px' },
  empty: { padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  item: { display: 'flex', alignItems: 'flex-start', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', gap: '10px', position: 'relative' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 },
  content: { flex: 1, minWidth: 0 },
  text: { fontSize: '13px', color: '#1f2937', display: 'flex', flexDirection: 'column', gap: '2px' },
  preview: { fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time: { fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block' },
  unreadDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0, marginTop: '6px' }
}