import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Yükleniyor...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}