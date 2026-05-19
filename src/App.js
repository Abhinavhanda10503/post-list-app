import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Postlist from './Postlist';
import PostForm from './Postform';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './App.css';

function App() {
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [localPosts, setLocalPosts]   = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin]     = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/local-posts')
      .then(res => res.json())
      .then(data => setLocalPosts(data))
      .catch(() => console.log('Could not load saved posts'));
  }, []); 

  const handlePostSaved = (newPost) => {
    setLocalPosts(prev => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        {showLogin ? (
          <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">SocialPost</span>
          </div>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="search-input"
            />
          </div>

          <div className="user-menu">
            <div className="user-info">
              <img src={user.avatar} alt={user.name} className="user-avatar" />
              <span className="user-name">{user.name}</span>
            </div>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          <PostForm onPostSaved={handlePostSaved} />
          <Postlist localPosts={localPosts} searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  );
}

export default App;