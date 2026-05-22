import { useState, memo } from 'react'
import { useAuth } from '../../context/AuthContext'
import './PostForm.css'

function PostForm({ onPostSaved }) {
  const { user }                      = useAuth()
  const [title,      setTitle]        = useState('')
  const [body,       setBody]         = useState('')
  const [loading,    setLoading]      = useState(false)
  const [success,    setSuccess]      = useState(false)
  const [error,      setError]        = useState(null)
  const [expanded,   setExpanded]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setLoading(true); setSuccess(false); setError(null)
    try {
      const saved = await fetch('http://localhost:5000/local-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author: user.name, authorEmail: user.email, authorAvatar: user.avatar, authorId: user.id })
      }).then(r => r.json())
      setSuccess(true); setTitle(''); setBody(''); setExpanded(false)
      onPostSaved(saved)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Could not save post. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally { setLoading(false) }
  }

  return (
    <div className="post-form-wrap">
      <div className="compose-row">
        <img src={user.avatar} alt={user.name} className="compose-avatar" />
        <div className="compose-area">
          {!expanded
            ? <button className="compose-trigger" onClick={() => setExpanded(true)}>What's on your mind, {user.name}?</button>
            : <form onSubmit={handleSubmit} className="compose-expanded">
                {success && <div className="compose-alert success">✓ Post published successfully!</div>}
                {error   && <div className="compose-alert error">⚠ {error}</div>}
                <input className="compose-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title…" autoFocus />
                <textarea className="compose-body-input" value={body} onChange={e => setBody(e.target.value)} placeholder="What's on your mind?" rows={4} />
                <div className="compose-footer">
                  <div className="compose-tools">
                    <button type="button" className="compose-tool">📷</button>
                    <button type="button" className="compose-tool">🎥</button>
                    <button type="button" className="compose-tool">📍</button>
                  </div>
                  <div className="compose-right">
                    <button type="submit" disabled={loading || !title.trim() || !body.trim()} className="post-submit-btn">
                      {loading ? 'Posting…' : 'Post'}
                    </button>
                    <button type="button" onClick={() => setExpanded(false)} className="compose-tool" style={{ color: 'var(--text-muted)' }}>✕</button>
                  </div>
                </div>
              </form>
          }
        </div>
      </div>
    </div>
  )
}

export default memo(PostForm)