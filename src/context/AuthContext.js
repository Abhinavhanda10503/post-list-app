import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user,       setUser]       = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const auth = localStorage.getItem('auth')
    const u    = localStorage.getItem('user')
    if (auth === 'true' && u) { setIsLoggedIn(true); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const persist = (data) => {
    setIsLoggedIn(true); setUser(data)
    localStorage.setItem('auth', 'true')
    localStorage.setItem('user', JSON.stringify(data))
    return data
  }

  const login = async (email, password) => {
    const res  = await fetch('http://localhost:5000/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    return persist(data)
  }

  const register = async (name, email, password) => {
    const res  = await fetch('http://localhost:5000/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    return persist(data)
  }

  const logout = () => {
    setIsLoggedIn(false); setUser(null)
    localStorage.removeItem('auth'); localStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ isLoggedIn, user, loading, login, logout, register }}>{children}</AuthContext.Provider>
}