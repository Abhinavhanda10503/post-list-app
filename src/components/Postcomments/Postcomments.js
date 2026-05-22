import { useState, useEffect, useCallback, useRef } from 'react'
import './PostComments.css'

const BASE = 'http://localhost:5000'
const getUser = () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null }
const isApi = (post) => !!post?.commentsData
const getStorageKey = (id) => `api_comments_${id}`
const loadStorage = (id) => { const s = localStorage.getItem(getStorageKey(id)); return s ? JSON.parse(s) : null }
const saveStorage = (id, c) => localStorage.setItem(getStorageKey(id), JSON.stringify(c))

const timeAgo = (d) => {
  if (!d) return 'Just now'
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

const resolve = (initial, post) => initial?.length ? initial : post?.commentsData?.length ? post.commentsData : post?.comments ?? []

function PostComments({ postId, post, initialComments, onCommentsUpdate }) {
  const [comments, setComments] = useState(() => {
    if (isApi(post)) { const p = loadStorage(postId); if (p) return p }
    return resolve(initialComments, post)
  })
  const [newComment, setNewComment] = useState('')
  const [replyTexts, setReplyTexts] = useState({})
  const [replyOpen, setReplyOpen] = useState({})
  const [showReplies, setShowReplies] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const push = useCallback((updated) => {
    setComments(updated)
    onCommentsUpdate?.(updated)
    if (isApi(post)) saveStorage(postId, updated)
  }, [onCommentsUpdate, post, postId])

  const tog = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }))

  const mounted = useRef(false)
  useEffect(() => {
    if (isApi(post)) {
      if (!mounted.current && comments.length === 0) {
        mounted.current = true
        const initial = resolve(initialComments, post)
        if (initial.length) push(initial)
      }
      return
    }
    if (comments.length) return
    setLoading(true)
    fetch(`${BASE}/local-posts/${postId}/comments`)
      .then(r => r.json()).then(d => push(Array.isArray(d) ? d : []))
      .catch(() => setError('Could not load comments'))
      .finally(() => setLoading(false))
  }, [postId, post])

  const addComment = useCallback(async (e) => {
    e?.preventDefault()
    if (!newComment.trim()) return
    const user = getUser(); if (!user) return
    const payload = { id: Date.now(), name: user.name, email: user.email, userId: user.id, body: newComment, createdAt: new Date().toISOString(), likes: 0, likedBy: [], replies: [] }
    if (isApi(post)) {
      push([payload, ...comments])
      setNewComment('')
    } else {
      try {
        const saved = await fetch(`${BASE}/local-posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json())
        push([saved, ...comments])
        setNewComment('')
      } catch { setError('Could not add comment'); setTimeout(() => setError(null), 3000) }
    }
  }, [newComment, comments, post, postId, push])

  const likeComment = useCallback(async (commentId) => {
    const user = getUser(); if (!user) return
    if (!isApi(post)) {
      try {
        const res = await fetch(`${BASE}/local-posts/${postId}/comments/${commentId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }).then(r => r.json())
        push(comments.map(c => c.id === commentId ? { ...c, likes: res.likes, isLikedByCurrentUser: res.isLiked } : c))
      } catch (err) { console.error('Failed to like comment', err) }
    } else {
      push(comments.map(c => c.id === commentId ? { ...c, isLikedByCurrentUser: !c.isLikedByCurrentUser, likes: (c.likes || 0) + (c.isLikedByCurrentUser ? -1 : 1) } : c))
    }
  }, [comments, post, postId, push])

  const likeReply = useCallback((commentId, replyId) => {
    push(comments.map(c => c.id === commentId ? { ...c, replies: c.replies.map(r => r.id === replyId ? { ...r, isLikedByCurrentUser: !r.isLikedByCurrentUser, likes: (r.likes || 0) + (r.isLikedByCurrentUser ? -1 : 1) } : r) } : c))
  }, [comments, push])

  const addReply = useCallback(async (commentId) => {
    const text = replyTexts[commentId]?.trim(); if (!text) return
    const user = getUser(); if (!user) return
    const reply = { id: Date.now(), name: user.name, email: user.email, userId: user.id, body: text, createdAt: new Date().toISOString(), likes: 0, likedBy: [], isLikedByCurrentUser: false }
    const update = (old) => old.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c)
    if (isApi(post)) {
      push(update(comments))
      setReplyTexts(p => ({ ...p, [commentId]: '' }))
      setReplyOpen(p => ({ ...p, [commentId]: false }))
    } else {
      try {
        const saved = await fetch(`${BASE}/local-posts/${postId}/comments/${commentId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reply) }).then(r => r.json())
        push(comments.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), saved] } : c))
        setReplyTexts(p => ({ ...p, [commentId]: '' }))
        setReplyOpen(p => ({ ...p, [commentId]: false }))
      } catch { setError('Could not add reply'); setTimeout(() => setError(null), 3000) }
    }
  }, [replyTexts, comments, post, postId, push])

  const user = getUser()
  if (loading) return <div className="comments-section"><p className="comments-status">Loading comments…</p></div>
  if (error) return <div className="comments-section"><p className="comments-status error">⚠ {error}</p></div>

  return (
    <div className="comments-section">
      <div className="comment-compose">
        <div className="comment-compose-avatar">{user?.name?.charAt(0) || 'Y'}</div>
        <div className="comment-compose-right">
          <input className="comment-input" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) addComment(e) }} placeholder="Write a comment…" />
          <div className="comment-input-footer">
            <span className="comment-hint">Enter to send</span>
            <button className="comment-submit" onClick={addComment} disabled={!newComment.trim()}>Comment</button>
          </div>
        </div>
      </div>
      {comments.length === 0 ? <p className="no-comments">No comments yet. Be the first!</p> : <div className="comments-list">
        {comments.map((c, i) => (<div key={c.id || i} className="comment-item">
          <div className="comment-avatar">{c.name?.charAt(0) || '👤'}</div>
          <div className="comment-body-col">
            <div className="comment-author-row"><span className="comment-name">{c.name || 'Anonymous'}</span><span className="comment-email">{c.email}</span><span className="comment-time">{timeAgo(c.createdAt)}</span></div>
            <p className="comment-text">{c.body}</p>
            <div className="comment-actions">
              <button className="comment-action-btn" onClick={() => likeComment(c.id)}>{c.isLikedByCurrentUser ? '❤️' : '🤍'} {c.likes || 0}</button>
              <button className="comment-action-btn" onClick={() => tog(setReplyOpen, c.id)}>💬 Reply</button>
              {c.replies?.length > 0 && (<button className="comment-action-btn" onClick={() => tog(setShowReplies, c.id)}>{showReplies[c.id] ? '▲ Hide' : `▼ ${c.replies.length} repl${c.replies.length === 1 ? 'y' : 'ies'}`}</button>)}
            </div>
            {replyOpen[c.id] && (<div className="reply-compose"><div className="reply-compose-avatar">{user?.name?.charAt(0) || 'Y'}</div><div className="reply-compose-right"><input className="comment-input reply-input" value={replyTexts[c.id] || ''} onChange={e => setReplyTexts(p => ({ ...p, [c.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) addReply(c.id) }} placeholder={`Reply to ${c.name?.split(' ')[0] || 'comment'}…`} autoFocus /><div className="reply-actions-row"><button className="reply-cancel-btn" onClick={() => tog(setReplyOpen, c.id)}>Cancel</button><button className="reply-submit-btn" onClick={() => addReply(c.id)} disabled={!replyTexts[c.id]?.trim()}>Reply</button></div></div></div>)}
            {showReplies[c.id] && c.replies?.length > 0 && (<div className="replies-list">{c.replies.map((r, ri) => (<div key={r.id || ri} className="reply-item"><div className="reply-avatar">{r.name?.charAt(0) || '?'}</div><div className="reply-body"><div className="reply-author-row"><span className="reply-author-name">{r.name}</span><span className="reply-time">{timeAgo(r.createdAt)}</span></div><p className="reply-text">{r.body}</p><button className="comment-action-btn reply-like-btn" onClick={() => likeReply(c.id, r.id)}>{r.isLikedByCurrentUser ? '❤️' : '🤍'} {r.likes || 0}</button></div></div>))}</div>)}
          </div>
        </div>))}
      </div>}
    </div>
  )
}

export default PostComments