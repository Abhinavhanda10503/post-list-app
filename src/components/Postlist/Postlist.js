import { useState, useEffect, useCallback } from 'react'
import PostCard from '../Postcard/PostCard'
import './PostList.css'

const LIMIT = 8

// Helper for API post likes
const getApiPostLikesCount = (postId, defaultCount = 0) => {
  const key = `api_post_likes_count_${postId}`
  const saved = localStorage.getItem(key)
  return saved ? parseInt(saved) : defaultCount
}

function PostList({ localPosts, searchQuery }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`https://jsonplaceholder.typicode.com/posts?_page=${currentPage}&_limit=${LIMIT}`)
      .then(r => r.json())
      .then(async (postsData) => {
        if (!Array.isArray(postsData)) { setPosts([]); return }
        const enriched = await Promise.all(postsData.map(async (p) => {
          try {
            const comments = await fetch(`https://jsonplaceholder.typicode.com/posts/${p.id}/comments`).then(r => r.json())
            const arr = Array.isArray(comments) ? comments : []
            // Get saved like count from localStorage
            const savedLikes = getApiPostLikesCount(p.id, 0)
            return { ...p, commentsData: arr, commentsCount: arr.length, isLikedByCurrentUser: false, likes: savedLikes }
          } catch {
            return { ...p, commentsData: [], commentsCount: 0, isLikedByCurrentUser: false, likes: getApiPostLikesCount(p.id, 0) }
          }
        }))
        setPosts(enriched)
        setTotalPages(Math.ceil(100 / LIMIT))
      })
      .catch(() => setError('Could not load posts.'))
      .finally(() => setLoading(false))
  }, [currentPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const safeLocal = Array.isArray(localPosts) ? localPosts : []
  const safePosts = Array.isArray(posts) ? posts : []
  const all = [...safeLocal, ...safePosts]
  const displayed = searchQuery
    ? all.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : all

  const goToPrev = useCallback(() => {
    if (currentPage > 1) { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }, [currentPage])

  const goToNext = useCallback(() => {
    if (currentPage < totalPages && !searchQuery) { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }, [currentPage, totalPages, searchQuery])

  const handleLikeUpdate = (postId, likes, isLiked) => {
    setPosts(prev => (Array.isArray(prev) ? prev : []).map(p => p.id === postId ? { ...p, likes, isLikedByCurrentUser: isLiked } : p))
  }

  return (
    <div className="post-list">
      {searchQuery && (
        <div className="search-results-bar">🔍 {displayed.length} result{displayed.length !== 1 ? 's' : ''} for "{searchQuery}"</div>
      )}
      {error && <div className="error-banner">⚠ {error}</div>}

      {loading && displayed.length === 0 ? (
        <div className="feed-loading"><div className="feed-spinner" /><span style={{ fontSize: 14 }}>Loading posts…</span></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <h3>Nothing found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <>
          {displayed.map((post, i) => (
            <PostCard
              key={`${post.id}-${post.local ? 'local' : 'api'}`}
              post={post}
              searchQuery={searchQuery}
              isLocal={safeLocal.some(lp => lp.id === post.id)}
              initialComments={post.commentsData || []}
              initialCommentsCount={post.commentsCount || 0}
              onLikeUpdate={handleLikeUpdate}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
          {!searchQuery && totalPages > 1 && (
            <div className="pagination-bar">
              <button className="page-nav-btn" onClick={goToPrev} disabled={currentPage === 1}>← Prev</button>
              <div className="page-indicator">
                <span className="page-text">Page {currentPage} of {totalPages}</span>
              </div>
              <button className="page-nav-btn" onClick={goToNext} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PostList