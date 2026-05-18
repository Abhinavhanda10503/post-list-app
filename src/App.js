import { useState, useEffect } from 'react';
import Postlist from './Postlist';
import PostForm from './Postform';

function App() {
  const [localPosts, setLocalPosts] = useState([]);

  // load saved posts from file on startup
  useEffect(() => {
    fetch('http://localhost:5000/local-posts')
      .then(res => res.json())
      .then(data => setLocalPosts(data));
  }, []);

  const handlePostSaved = (newPost) => {
    setLocalPosts(prev => [newPost, ...prev]);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff',
        borderBottom: '1px solid #eff3f4',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '27px', fontWeight: '700' }}>Post</span>
      </div>

      <PostForm onPostSaved={handlePostSaved} />
      <div style={{ height: '8px', background: '#f0f2f5' }} />
      <Postlist localPosts={localPosts} />
    </div>
  );
}

export default App;
