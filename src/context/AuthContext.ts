import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// ---------- Type definitions ----------
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

// ---------- Create context ----------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- Hook ----------
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

// ---------- Provider props ----------
interface AuthProviderProps {
  children: ReactNode;
}

// ---------- Provider component ----------
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load persisted auth on mount
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    const u = localStorage.getItem('user');
    if (auth === 'true' && u) {
      setIsLoggedIn(true);
      setUser(JSON.parse(u) as User);
    }
    setLoading(false);
  }, []);

  const persist = (data: User): User => {
    setIsLoggedIn(true);
    setUser(data);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return persist(data as User);
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    const res = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return persist(data as User);
  };

  const logout = (): void => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { isLoggedIn, user, loading, login, logout, register } },
    children
  );
};