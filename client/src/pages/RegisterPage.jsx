import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt olunamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💬 ChatApp</h1>
        <h2 style={styles.subtitle}>Kayıt Ol</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Kullanıcı adı"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p style={styles.link}>
          Hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.1)', width: '360px' },
  title: { textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' },
  subtitle: { textAlign: 'center', marginBottom: '1.5rem', color: '#555', fontWeight: 400 },
  error: { background: '#fee', color: '#c00', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
  input: { width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
  link: { textAlign: 'center', marginTop: '1rem', color: '#555', fontSize: '14px' }
}