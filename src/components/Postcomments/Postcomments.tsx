import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import './PostComments.css';

// ---------- Types ----------
interface User {
    id: number;
    name: string;
    email: string;
}

interface Reply {
    id: number;
    name: string;
    email: string;
    userId: number;
    body: string;
    createdAt: string;
    likes: number;
    likedBy: number[];
    isLikedByCurrentUser: boolean;
}

interface Comment {
    id: number;
    name: string;
    email: string;
    userId: number;
    body: string;
    createdAt: string;
    likes: number;
    likedBy: number[];
    replies: Reply[];
    isLikedByCurrentUser: boolean;
}

interface GraphQLComment {
    id: number;
    name: string;
    email: string;
    body: string;
}

interface PostCommentsProps {
    postId: number;
    post: any; // not used, kept for compatibility
    initialComments?: Comment[];
    onCommentsUpdate?: (comments: Comment[]) => void;
    isApiPost?: boolean;
}

// ---------- Helpers ----------
const BASE = 'http://localhost:5000';

const getUser = (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};

const getStorageKey = (id: number): string => `api_comments_${id}`;
const loadStorage = (id: number): Comment[] | null => {
    const s = localStorage.getItem(getStorageKey(id));
    return s ? JSON.parse(s) : null;
};
const saveStorage = (id: number, c: Comment[]): void =>
    localStorage.setItem(getStorageKey(id), JSON.stringify(c));

const timeAgo = (d?: string): string => {
    if (!d) return 'Just now';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
};

// ---------- GraphQL Query ----------
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

// ---------- Component ----------
function PostComments({
    postId,
    post: _post, // unused, but kept to match prop signature
    initialComments = [],
    onCommentsUpdate,
    isApiPost = false,
}: PostCommentsProps) {
    // State
    const [comments, setComments] = useState<Comment[]>(() => {
        if (isApiPost) {
            const stored = loadStorage(postId);
            return stored || [];
        }
        return initialComments?.length ? initialComments : [];
    });

    const [newComment, setNewComment] = useState<string>('');
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
    const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
    const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    // GraphQL for API posts
    const { data: graphqlComments, loading: graphqlLoading, error: graphqlError } = useQuery<{
        comments: GraphQLComment[];
    }>(GET_COMMENTS, {
        variables: { postId: postId.toString() },
        skip: !isApiPost || comments.length > 0,
    });

    // When GraphQL data arrives, format and store
    useEffect(() => {
        if (isApiPost && graphqlComments && comments.length === 0) {
            const formatted: Comment[] = graphqlComments.comments.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                userId: 0, // not provided by JSONPlaceholder
                body: c.body,
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

    // Unified update function (persists to localStorage for API posts)
    const push = useCallback(
        (updated: Comment[]) => {
            setComments(updated);
            onCommentsUpdate?.(updated);
            if (isApiPost) saveStorage(postId, updated);
        },
        [onCommentsUpdate, isApiPost, postId]
    );

    const toggle = (setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>, id: number) => {
        setter((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Add a new comment
    const addComment = useCallback(async () => {
        if (!newComment.trim()) return;
        const user = getUser();
        if (!user) return;
        const payload: Comment = {
            id: Date.now(),
            name: user.name,
            email: user.email,
            userId: user.id,
            body: newComment,
            createdAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            replies: [],
            isLikedByCurrentUser: false,
        };
        push([payload, ...comments]);
        setNewComment('');
    }, [newComment, comments, push]);

    // Like a comment (local or API)
    const likeComment = useCallback(
        async (commentId: number) => {
            const user = getUser();
            if (!user) return;
            if (!isApiPost) {
                try {
                    const res = await fetch(`${BASE}/local-posts/${postId}/comments/${commentId}/like`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                    }).then((r) => r.json());
                    push(
                        comments.map((c) =>
                            c.id === commentId
                                ? { ...c, likes: res.likes, isLikedByCurrentUser: res.isLiked }
                                : c
                        )
                    );
                } catch (err) {
                    console.error(err);
                }
            } else {
                push(
                    comments.map((c) =>
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

    // Like a reply (only local – API posts don't have replies)
    const likeReply = useCallback(
        (commentId: number, replyId: number) => {
            push(
                comments.map((c) =>
                    c.id === commentId
                        ? {
                            ...c,
                            replies: c.replies.map((r) =>
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

    // Add a reply to a comment
    const addReply = useCallback(
        async (commentId: number) => {
            const text = replyTexts[commentId]?.trim();
            if (!text) return;
            const user = getUser();
            if (!user) return;
            const reply: Reply = {
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
                    const saved = await fetch(
                        `${BASE}/local-posts/${postId}/comments/${commentId}/replies`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(reply),
                        }
                    ).then((r) => r.json());
                    push(
                        comments.map((c) =>
                            c.id === commentId ? { ...c, replies: [...(c.replies || []), saved] } : c
                        )
                    );
                    setReplyTexts((p) => ({ ...p, [commentId]: '' }));
                    setReplyOpen((p) => ({ ...p, [commentId]: false }));
                } catch {
                    setError('Could not add reply');
                    setTimeout(() => setError(null), 3000);
                }
            } else {
                // API posts – store only in memory/localStorage (no backend)
                push(
                    comments.map((c) =>
                        c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
                    )
                );
                setReplyTexts((p) => ({ ...p, [commentId]: '' }));
                setReplyOpen((p) => ({ ...p, [commentId]: false }));
            }
        },
        [replyTexts, comments, isApiPost, postId, push]
    );

    const user = getUser();

    // Loading / error states
    if (isApiPost && graphqlLoading && comments.length === 0) {
        return (
            <div className="comments-section">
                <p className="comments-status">Loading comments…</p>
            </div>
        );
    }
    if (graphqlError && isApiPost) {
        return (
            <div className="comments-section">
                <p className="comments-status error">⚠ Could not load comments</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="comments-section">
                <p className="comments-status error">⚠ {error}</p>
            </div>
        );
    }

    // Render
    return (
        <div className="comments-section">
            <div className="comment-compose">
                <div className="comment-compose-avatar">{user?.name?.charAt(0) || 'Y'}</div>
                <div className="comment-compose-right">
                    <input
                        className="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
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
                                    <button className="comment-action-btn" onClick={() => toggle(setReplyOpen, c.id)}>
                                        💬 Reply
                                    </button>
                                    {c.replies?.length > 0 && (
                                        <button
                                            className="comment-action-btn"
                                            onClick={() => toggle(setShowReplies, c.id)}
                                        >
                                            {showReplies[c.id]
                                                ? '▲ Hide'
                                                : `▼ ${c.replies.length} repl${c.replies.length === 1 ? 'y' : 'ies'}`}
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
                                                onChange={(e) =>
                                                    setReplyTexts((p) => ({ ...p, [c.id]: e.target.value }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) addReply(c.id);
                                                }}
                                                placeholder={`Reply to ${c.name?.split(' ')[0] || 'comment'}…`}
                                                autoFocus
                                            />
                                            <div className="reply-actions-row">
                                                <button
                                                    className="reply-cancel-btn"
                                                    onClick={() => toggle(setReplyOpen, c.id)}
                                                >
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