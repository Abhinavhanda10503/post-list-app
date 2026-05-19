import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import './PostForm.css';

function PostForm({ onPostSaved }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/local-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          body,
          author: user.name,
          authorEmail: user.email,
          authorAvatar: user.avatar
        }),
      });
      const saved = await response.json();
      
      setLoading(false);
      setSuccess(true);
      setTitle('');
      setBody('');
      setIsExpanded(false);
      onPostSaved(saved);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setLoading(false);
      setError('Could not save post. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="post-form-container">
      <div className="post-form-card">
        <div className="form-header">
          <img src={user.avatar} alt={user.name} className="user-avatar-form" />
          <button 
            className="create-post-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Cancel' : `What's on your mind, ${user.name}?`}
          </button>
        </div>
        
        {isExpanded && (
          <form onSubmit={handleSubmit}>
            {success && (
              <div className="alert success">
                ✓ Post published successfully!
              </div>
            )}
            {error && (
              <div className="alert error">
                {error}
              </div>
            )}
            
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post title..."
              required
              className="form-input"
            />
            
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What's on your mind?"
              required
              rows={4}
              className="form-textarea"
            />
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading || !title.trim() || !body.trim()}
                className="submit-btn"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PostForm;