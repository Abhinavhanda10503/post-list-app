import { useState } from 'react';
import PostComments from './Postcomments';
import './PostCard.css';

function PostCard({ post, searchQuery, isLocal, initialComments = [], initialCommentsCount = 0 }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState(initialComments);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentsUpdate = (updatedComments) => {
    setComments(updatedComments);
    setCommentsCount(updatedComments.length);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="highlight">{part}</mark>
        : part
    );
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          <img src={`https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png`} alt="avatar" />
        </div>
        <div className="post-author-info">
          <div className="author-name">
            {isLocal ? 'You' : `User ${post.userId || 'Anonymous'}`}
            {isLocal && <span className="local-badge">Local</span>}
          </div>
          <div className="post-time">Just now</div>
        </div>
        <button className="post-menu">⋮</button>
      </div>

      <div className="post-content">
        <h3 className="post-title">
          {highlightText(post.title, searchQuery)}
        </h3>
        <p className="post-body">
          {highlightText(post.body, searchQuery)}
        </p>
      </div>

      <div className="post-stats">
        <span>❤️ {likesCount} likes</span>
        <span>💬 {commentsCount} comment{commentsCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span>❤️</span> Like
        </button>
        <button 
          className="action-btn"
          onClick={toggleComments}
        >
          <span>💬</span> Comment
        </button>
        <button className="action-btn">
          <span>🔄</span> Share
        </button>
      </div>

      {showComments && (
        <PostComments 
          postId={post.id}
          initialComments={comments}
          onCommentsUpdate={handleCommentsUpdate}
        />
      )}
    </article>
  );
}

export default PostCard;