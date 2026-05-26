import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import './PostComments.css';

const BASE = 'http://localhost:5000';
const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
const getStorageKey = id => `api_comments_${id}`;
const loadStorage = id => {
  const s = localStorage.getItem(getStorageKey(id));
  return s ? JSON.parse(s) : null;
};
const saveStorage = (id, c) => localStorage.setItem(getStorageKey(id), JSON.stringify(c));

const timeAgo = d => {
  if (!d) return 'Just now';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};

const GET_COMMENTS = gql`
  query GetComments($postId: ID!) {
    comments(postId: $postId) {
      id
      name
      email
      body
    }
  }
`;

function PostComments({ postId, post, initialComments, onCommentsUpdate, isApiPost = false }) {
  const [comments, setComments] = useState(() => {
    if (isApiPost) {
      const stored = loadStorage(postId);
      return stored || [];
    }
    return initialComments?.length ? initialComments : [];
  });

  const [newComment, setNewComment] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GraphQL query for API posts
  const { data: graphqlComments, loading: graphqlLoading, error: graphqlError } = useQuery(GET_COMMENTS, {
    variables: { postId: postId.toString() },
    skip: !isApiPost || comments.length > 0,
  });

  useEffect(() => {
    if (isApiPost && graphqlComments && comments.length === 0) {
      const formatted = graphqlComments.comments.map(c => ({
        ...c,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        replies: [],
        isLikedByCurrentUser: false,
      }));
      setComments(formatted);
      saveStorage(postId, formatted);
      onCommentsUpdate?.(formatted);
    }
  }, [graphqlComments, isApiPost, postId, comments.length, onCommentsUpdate]);

  const push = useCallback(
    updated => {
      setComments(updated);
      onCommentsUpdate?.(updated);
      if (isApiPost) saveStorage(postId, updated);
    },
    [onCommentsUpdate, isApiPost, postId]
  );

  const tog = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }));

  const addComment = useCallback(async () => {
    if (!newComment.trim()) return;
    const user = getUser();
    if (!user) return;
    const payload = {
      id: Date.now(),
      name: user.name,
      email: user.email,
      userId: user.id,
      body: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: [],
    };
    push([payload, ...comments]);
    setNewComment('');
  }, [newComment, comments, push]);

  const likeComment = useCallback(
    async commentId => {
      const user = getUser();
      if (!user) return;
      if (!isApiPost) {
        try {
          const res = await fetch(`${BASE}/local-posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          }).then(r => r.json());
          push(
            comments.map(c =>
              c.id === commentId ? { ...c, likes: res.likes, isLikedByCurrentUser: res.isLiked } : c
            )
          );
        } catch (err) {
          console.error(err);
        }
      } else {
        push(
          comments.map(c =>
            c.id === commentId
              ? {
                  ...c,
                  isLikedByCurrentUser: !c.isLikedByCurrentUser,
                  likes: (c.likes || 0) + (c.isLikedByCurrentUser ? -1 : 1),
                }
              : c
          )
        );
      }
    },
    [comments, isApiPost, postId, push]
  );

  const likeReply = useCallback(
    (commentId, replyId) => {
      push(
        comments.map(c =>
          c.id === commentId
            ? {
                ...c,
                replies: c.replies.map(r =>
                  r.id === replyId
                    ? {
                        ...r,
                        isLikedByCurrentUser: !r.isLikedByCurrentUser,
                        likes: (r.likes || 0) + (r.isLikedByCurrentUser ? -1 : 1),
                      }
                    : r
                ),
              }
            : c
        )
      );
    },
    [comments, push]
  );

  const addReply = useCallback(
    async commentId => {
      const text = replyTexts[commentId]?.trim();
      if (!text) return;
      const user = getUser();
      if (!user) return;
      const reply = {
        id: Date.now(),
        name: user.name,
        email: user.email,
        userId: user.id,
        body: text,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        isLikedByCurrentUser: false,
      };
      if (!isApiPost) {
        try {
          const saved = await fetch(`${BASE}/local-posts/${postId}/comments/${commentId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply),
          }).then(r => r.json());
          push(
            comments.map(c =>
              c.id === commentId ? { ...c, replies: [...(c.replies || []), saved] } : c
            )
          );
          setReplyTexts(p => ({ ...p, [commentId]: '' }));
          setReplyOpen(p => ({ ...p, [commentId]: false }));
        } catch {
          setError('Could not add reply');
          setTimeout(() => setError(null), 3000);
        }
      } else {
        push(
          comments.map(c =>
            c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
          )
        );
        setReplyTexts(p => ({ ...p, [commentId]: '' }));
        setReplyOpen(p => ({ ...p, [commentId]: false }));
      }
    },
    [replyTexts, comments, isApiPost, postId, push]
  );

  const user = getUser();
  if (isApiPost && graphqlLoading && comments.length === 0)
    return (
      <div className="comments-section">
        <p className="comments-status">Loading comments…</p>
      </div>
    );
  if (graphqlError && isApiPost)
    return (
      <div className="comments-section">
        <p className="comments-status error">⚠ Could not load comments</p>
      </div>
    );
  if (error)
    return (
      <div className="comments-section">
        <p className="comments-status error">⚠ {error}</p>
      </div>
    );

  return (
    <div className="comments-section">
      <div className="comment-compose">
        <div className="comment-compose-avatar">{user?.name?.charAt(0) || 'Y'}</div>
        <div className="comment-compose-right">
          <input
            className="comment-input"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) addComment();
            }}
            placeholder="Write a comment…"
          />
          <div className="comment-input-footer">
            <span className="comment-hint">Enter to send</span>
            <button className="comment-submit" onClick={addComment} disabled={!newComment.trim()}>
              Comment
            </button>
          </div>
        </div>
      </div>
      {comments.length === 0 ? (
        <p className="no-comments">No comments yet. Be the first!</p>
      ) : (
        <div className="comments-list">
          {comments.map((c, i) => (
            <div key={c.id || i} className="comment-item">
              <div className="comment-avatar">{c.name?.charAt(0) || '👤'}</div>
              <div className="comment-body-col">
                <div className="comment-author-row">
                  <span className="comment-name">{c.name || 'Anonymous'}</span>
                  <span className="comment-email">{c.email}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.body}</p>
                <div className="comment-actions">
                  <button className="comment-action-btn" onClick={() => likeComment(c.id)}>
                    {c.isLikedByCurrentUser ? '❤️' : '🤍'} {c.likes || 0}
                  </button>
                  <button className="comment-action-btn" onClick={() => tog(setReplyOpen, c.id)}>
                    💬 Reply
                  </button>
                  {c.replies?.length > 0 && (
                    <button className="comment-action-btn" onClick={() => tog(setShowReplies, c.id)}>
                      {showReplies[c.id] ? '▲ Hide' : `▼ ${c.replies.length} repl${c.replies.length === 1 ? 'y' : 'ies'}`}
                    </button>
                  )}
                </div>
                {replyOpen[c.id] && (
                  <div className="reply-compose">
                    <div className="reply-compose-avatar">{user?.name?.charAt(0) || 'Y'}</div>
                    <div className="reply-compose-right">
                      <input
                        className="comment-input reply-input"
                        value={replyTexts[c.id] || ''}
                        onChange={e => setReplyTexts(p => ({ ...p, [c.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) addReply(c.id);
                        }}
                        placeholder={`Reply to ${c.name?.split(' ')[0] || 'comment'}…`}
                        autoFocus
                      />
                      <div className="reply-actions-row">
                        <button className="reply-cancel-btn" onClick={() => tog(setReplyOpen, c.id)}>
                          Cancel
                        </button>
                        <button
                          className="reply-submit-btn"
                          onClick={() => addReply(c.id)}
                          disabled={!replyTexts[c.id]?.trim()}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {showReplies[c.id] && c.replies?.length > 0 && (
                  <div className="replies-list">
                    {c.replies.map((r, ri) => (
                      <div key={r.id || ri} className="reply-item">
                        <div className="reply-avatar">{r.name?.charAt(0) || '?'}</div>
                        <div className="reply-body">
                          <div className="reply-author-row">
                            <span className="reply-author-name">{r.name}</span>
                            <span className="reply-time">{timeAgo(r.createdAt)}</span>
                          </div>
                          <p className="reply-text">{r.body}</p>
                          <button
                            className="comment-action-btn reply-like-btn"
                            onClick={() => likeReply(c.id, r.id)}
                          >
                            {r.isLikedByCurrentUser ? '❤️' : '🤍'} {r.likes || 0}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostComments;