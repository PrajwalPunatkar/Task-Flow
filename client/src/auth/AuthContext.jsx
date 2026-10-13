import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import { clearStoredSession, getStoredSession, saveSession } from './session.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())

  useEffect(() => {
    const clearSession = () => {
      clearStoredSession()
      setSession(null)
    }
    window.addEventListener('taskflow:session-expired', clearSession)
    return () => window.removeEventListener('taskflow:session-expired', clearSession)
  }, [])

  const login = (token, user) => {
    saveSession(token, user)
    setSession({ token, user })
  }

  const logout = () => {
    clearStoredSession()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
