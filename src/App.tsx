import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useAuth, User } from './context/AuthContext';
import './App.css';

// Types for local posts (from your backend)
interface LocalPost {
  id: number;
  title: string;
  body: string;
  author: string;
  authorEmail: string;
  authorAvatar: string;
  authorId: number;
  local: boolean;
  createdAt: string;
  likes: number;
  comments: any[];
}

const PostList = lazy(() => import('./components/Postlist/Postlist'));
const PostForm = lazy(() => import('./components/Postform/Postform'));
const LoginForm = lazy(() => import('./Pages/Loginform/LoginForm'));
const RegisterForm = lazy(() => import('./Pages/Registerform/RegisterForm'));

function PageSpinner() {
  return (
    <div className="page-loader">
      <div className="loader-ring" />
      <span className="loader-text">Loading…</span>
    </div>
  );
}

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home', id: 'home' },
];

function App() {
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLogin, setShowLogin] = useState<boolean>(true);
  const [activeNav, setActiveNav] = useState<string>('home');

  useEffect(() => {
    fetch('http://localhost:5000/local-posts')
      .then((res) => res.json())
      .then((data: LocalPost[]) => setLocalPosts(data))
      .catch(() => {});
  }, []);

  const handlePostSaved = useCallback((newPost: LocalPost) => {
    setLocalPosts((prev) => [newPost, ...prev]);
  }, []);

  if (loading) return <PageSpinner />;

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<PageSpinner />}>
        {showLogin ? (
          <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </Suspense>
    );
  }

  return (
    <div className="app">
      {/* Left sidebar */}
      <aside className="sidebar">
        <a href="/" className="sidebar-logo" onClick={(e) => e.preventDefault()}>
          <div className="sidebar-logo-icon">✍️</div>
          <span className="sidebar-logo-text">
            Social<span>Post</span>
          </span>
        </a>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => setActiveNav(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="nav-divider" />

        <div className="sidebar-user">
          <img src={user!.avatar} alt={user!.name} className="sidebar-avatar" />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user!.name}</div>
            <div className="sidebar-user-handle">@{user!.email?.split('@')[0]}</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out">
            ↩
          </button>
        </div>
      </aside>

      {/* Main feed */}
      <main className="main-feed">
        <header className="feed-header">
          <span className="feed-title">Home</span>
          <div className="search-wrap">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts…"
            />
          </div>
        </header>

        <Suspense
          fallback={
            <div className="page-loader" style={{ height: 200 }}>
              <div className="loader-ring" />
            </div>
          }
        >
          <PostForm onPostSaved={handlePostSaved} />
          <PostList localPosts={localPosts} searchQuery={searchQuery} />
        </Suspense>
      </main>
    </div>
  );
}

export default App;