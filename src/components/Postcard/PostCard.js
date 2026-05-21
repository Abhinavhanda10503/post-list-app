import { useState, useCallback, memo } from 'react'
import PostComments from '../Postcomments/Postcomments';
import './PostCard.css';

function PostCard({ post, searchQuery, isLocal, initialComments = [], initialCommentsCount = 0 }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState(initialComments);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const handleLike = useCallback(() => {
    setLikesCount(prev => liked ? prev - 1 : prev + 1)
    setLiked(prev => !prev)
  }, [liked])

  const toggleComments = useCallback(() => setShowComments(prev => !prev), [])

  const handleCommentsUpdate = useCallback((updated) => {
    setComments(updated)
    setCommentsCount(updated.length)
  }, [])

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="highlight">{part}</mark>
        : part
    );
  };

  const authorName = isLocal
    ? (post.author || 'You')
    : `User ${post.userId || '?'}`;

  const handle = isLocal
    ? `@${(post.authorEmail || 'you').split('@')[0]}`
    : `@user${post.userId || '0'}`;

  const avatarSrc = isLocal && post.authorAvatar
    ? post.authorAvatar
    : `https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png`;

  return (
    <article className="post-card">
      <div className="post-card-inner">
        {/* Avatar column */}
        <div className="post-avatar-col">
          <img src={avatarSrc} alt={authorName} className="post-avatar" />
          {showComments && <div className="avatar-thread-line" />}
        </div>

        {/* Content column */}
        <div className="post-content-col">
          <div className="post-top-row">
            <span className="post-author">{authorName}</span>
            {isLocal && <span className="local-badge">You</span>}
          </div>

          <div className="post-handle">{handle}</div>

          <h3 className="post-title">
            {highlightText(post.title, searchQuery)}
          </h3>
          <p className="post-body">
            {highlightText(post.body, searchQuery)}
          </p>

          {/* Action row */}
          <div className="post-actions">
            <button
              className={`action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              title="Like"
            >
              <span className="action-icon-wrap">
                {liked ? '❤️' : '🤍'}
              </span>
              <span className="action-count">{likesCount}</span>
            </button>

            <button
              className="action-btn comment-btn"
              onClick={toggleComments}
              title="Comment"
            >
              <span className="action-icon-wrap">💬</span>
              <span className="action-count">{commentsCount}</span>
            </button>
          </div>
        </div>
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

export default memo(PostCard)