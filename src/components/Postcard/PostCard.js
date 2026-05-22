import { useState, useCallback, memo } from 'react'
import PostComments from '../Postcomments/Postcomments'
import './PostCard.css'

const getUser = () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null }

// Storage keys for API post likes
const getApiPostLikesKey = (postId, userId) => `api_post_like_${postId}_${userId}`
const getApiPostLikesCountKey = (postId) => `api_post_likes_count_${postId}`

const getApiPostLikeStatus = (postId, userId) => {
  const key = getApiPostLikesKey(postId, userId)
  return localStorage.getItem(key) === 'true'
}

const setApiPostLikeStatus = (postId, userId, liked) => {
  const key = getApiPostLikesKey(postId, userId)
  localStorage.setItem(key, liked.toString())
}

const getApiPostLikesCount = (postId, defaultCount = 0) => {
  const key = getApiPostLikesCountKey(postId)
  const saved = localStorage.getItem(key)
  return saved ? parseInt(saved) : defaultCount
}

const setApiPostLikesCount = (postId, count) => {
  const key = getApiPostLikesCountKey(postId)
  localStorage.setItem(key, count.toString())
}

function PostCard({ post, searchQuery, isLocal, initialComments = [], initialCommentsCount = 0, onLikeUpdate }) {
  // Initialize like state from localStorage for API posts
  const getInitialLiked = () => {
    if (isLocal) return post.isLikedByCurrentUser || false
    const user = getUser()
    if (!user) return false
    return getApiPostLikeStatus(post.id, user.id)
  }
  
  const getInitialLikesCount = () => {
    if (isLocal) return post.likes || 0
    return getApiPostLikesCount(post.id, post.likes || 0)
  }

  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(getInitialLiked)
  const [likesCount, setLikesCount] = useState(getInitialLikesCount)
  const [isLiking, setIsLiking] = useState(false)

  const [comments, setComments] = useState(() =>
    initialComments?.length ? initialComments
    : post.commentsData?.length ? post.commentsData
    : post.comments?.length ? post.comments
    : []
  )
  const [commentsCount, setCommentsCount] = useState(() =>
    initialCommentsCount > 0 ? initialCommentsCount
    : post.commentsCount ? post.commentsCount
    : post.commentsData?.length ?? post.comments?.length ?? 0
  )

  const handleLike = useCallback(async () => {
    if (isLiking) return
    const user = getUser()
    if (!user) return

    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount(c => c + (newLiked ? 1 : -1))

    // For API posts (JSONPlaceholder) - store in localStorage
    if (!isLocal) {
      setApiPostLikeStatus(post.id, user.id, newLiked)
      setApiPostLikesCount(post.id, likesCount + (newLiked ? 1 : -1))
      onLikeUpdate?.(post.id, likesCount + (newLiked ? 1 : -1), newLiked)
      return
    }

    // For local posts - send to server
    setIsLiking(true)
    try {
      const { likes, isLiked } = await fetch(`http://localhost:5000/local-posts/${post.id}/like`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).then(r => r.json())

      setLikesCount(likes)
      setLiked(isLiked)
      onLikeUpdate?.(post.id, likes, isLiked)
    } catch {
      setLiked(!newLiked)
      setLikesCount(c => c + (newLiked ? -1 : 1))
    } finally {
      setIsLiking(false)
    }
  }, [liked, isLocal, post.id, isLiking, onLikeUpdate, likesCount])

  const handleCommentsUpdate = useCallback((updated) => {
    const arr = Array.isArray(updated) ? updated : []
    setComments(arr)
    setCommentsCount(arr.length)
  }, [])

  const highlight = (text, query) => {
    if (!query || !text) return text
    return text.split(new RegExp(`(${query})`, 'gi')).map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="highlight">{p}</mark> : p
    )
  }

  const authorName = isLocal ? (post.author || 'You') : `User ${post.userId || '?'}`
  const handle = isLocal ? `@${(post.authorEmail || 'you').split('@')[0]}` : `@user${post.userId || '0'}`
  const avatarSrc = isLocal && post.authorAvatar
    ? post.authorAvatar
    : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'

  return (
    <article className="post-card">
      <div className="post-card-inner">
        <div className="post-avatar-col">
          <img src={avatarSrc} alt={authorName} className="post-avatar" />
          {showComments && <div className="avatar-thread-line" />}
        </div>
        <div className="post-content-col">
          <div className="post-top-row">
            <span className="post-author">{authorName}</span>
            {isLocal && <span className="local-badge">You</span>}
          </div>
          <div className="post-handle">{handle}</div>
          <h3 className="post-title">{highlight(post.title, searchQuery)}</h3>
          <p className="post-body">{highlight(post.body, searchQuery)}</p>
          <div className="post-actions">
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={isLiking}>
              <span className="action-icon-wrap">{liked ? '❤️' : '🤍'}</span>
              <span className="action-count">{likesCount}</span>
            </button>
            <button className="action-btn comment-btn" onClick={() => setShowComments(p => !p)}>
              <span className="action-icon-wrap">💬</span>
              <span className="action-count">{commentsCount}</span>
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <PostComments postId={post.id} post={post} initialComments={comments} onCommentsUpdate={handleCommentsUpdate} />
      )}
    </article>
  )
}

export default memo(PostCard)