import { useEffect } from 'react'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { useAuth } from './auth/authContext.js'
import './App.css'

function AppRoutes() {
  const { user } = useAuth()
  const path = window.location.pathname

  useEffect(() => {
    if (path === '/') window.location.replace(user ? '/dashboard' : '/login')
    if (path === '/dashboard' && !user) window.location.replace('/login')
    if ((path === '/login' || path === '/register') && user) window.location.replace('/dashboard')
  }, [path, user])

  if (path === '/dashboard') return user ? <DashboardPage /> : <AuthPage mode="login" />
  if (path === '/register') return <AuthPage mode="register" />
  return <AuthPage mode="login" />
}

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}

export default App
