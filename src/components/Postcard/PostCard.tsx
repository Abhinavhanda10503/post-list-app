import { useState, useCallback, memo } from 'react';
import PostComments from '../Postcomments/Postcomments';
import './PostCard.css';

// ---------- User helpers ----------
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

const getUser = (): User | null => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};

// ---------- API post like storage (localStorage) ----------
const getApiPostLikesKey = (postId: number, userId: number): string =>
  `api_post_like_${postId}_${userId}`;
const getApiPostLikesCountKey = (postId: number): string =>
  `api_post_likes_count_${postId}`;

const getApiPostLikeStatus = (postId: number, userId: number): boolean => {
  const key = getApiPostLikesKey(postId, userId);
  return localStorage.getItem(key) === 'true';
};

const setApiPostLikeStatus = (postId: number, userId: number, liked: boolean): void => {
  const key = getApiPostLikesKey(postId, userId);
  localStorage.setItem(key, liked.toString());
};

const getApiPostLikesCount = (postId: number, defaultCount: number = 0): number => {
  const key = getApiPostLikesCountKey(postId);
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : defaultCount;
};

const setApiPostLikesCount = (postId: number, count: number): void => {
  const key = getApiPostLikesCountKey(postId);
  localStorage.setItem(key, count.toString());
};

// ---------- Types for Post and Props ----------
// Local post (from your backend)
interface LocalPost {
  id: number;
  title: string;
  body: string;
  author: string;
  authorEmail: string;
  authorAvatar: string;
  authorId: number;
  local: boolean;
  createdAt: string;
  likes: number;
  isLikedByCurrentUser?: boolean;
  comments?: any[];
  commentsData?: any[];
  commentsCount?: number;
}

// API post (from JSONPlaceholder via GraphQL, enriched)
interface ApiPost {
  id: number;
  title: string;
  body: string;
  userId: number;
  commentsCount: number;
  commentsData?: any[];
  isLikedByCurrentUser: boolean;
  likes: number;
  local: false;
  [key: string]: any; // allow extra fields
}

type Post = LocalPost | ApiPost;

interface PostCardProps {
  post: Post;
  searchQuery: string;
  isLocal: boolean;
  initialComments?: any[];
  initialCommentsCount?: number;
  onLikeUpdate: (postId: number, likes: number, isLiked: boolean) => void;
}

// ---------- Component ----------
function PostCard({
  post,
  searchQuery,
  isLocal,
  initialComments = [],
  initialCommentsCount = 0,
  onLikeUpdate,
}: PostCardProps) {
  // Initialize like state from localStorage (for API posts) or server (local posts)
  const getInitialLiked = (): boolean => {
    if (isLocal) return post.isLikedByCurrentUser || false;
    const user = getUser();
    if (!user) return false;
    return getApiPostLikeStatus(post.id, user.id);
  };

  const getInitialLikesCount = (): number => {
    if (isLocal) return post.likes || 0;
    return getApiPostLikesCount(post.id, post.likes || 0);
  };

  const [showComments, setShowComments] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(getInitialLiked);
  const [likesCount, setLikesCount] = useState<number>(getInitialLikesCount);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const [comments, setComments] = useState<any[]>(() =>
    initialComments?.length
      ? initialComments
      : post.commentsData?.length
      ? post.commentsData
      : post.comments?.length
      ? post.comments
      : []
  );

  const [commentsCount, setCommentsCount] = useState<number>(() =>
    initialCommentsCount > 0
      ? initialCommentsCount
      : post.commentsCount
      ? post.commentsCount
      : post.commentsData?.length ?? post.comments?.length ?? 0
  );

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    const user = getUser();
    if (!user) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));

    // For API posts – store in localStorage (fake persistence)
    if (!isLocal) {
      setApiPostLikeStatus(post.id, user.id, newLiked);
      const newCount = likesCount + (newLiked ? 1 : -1);
      setApiPostLikesCount(post.id, newCount);
      onLikeUpdate?.(post.id, newCount, newLiked);
      return;
    }

    // For local posts – send to server
    setIsLiking(true);
    try {
      const { likes, isLiked } = await fetch(
        `http://localhost:5000/local-posts/${post.id}/like`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }
      ).then((r) => r.json());

      setLikesCount(likes);
      setLiked(isLiked);
      onLikeUpdate?.(post.id, likes, isLiked);
    } catch {
      // rollback
      setLiked(!newLiked);
      setLikesCount((c) => c + (newLiked ? -1 : 1));
    } finally {
      setIsLiking(false);
    }
  }, [liked, isLocal, post.id, isLiking, onLikeUpdate, likesCount]);

  const handleCommentsUpdate = useCallback((updated: any[]) => {
    const arr = Array.isArray(updated) ? updated : [];
    setComments(arr);
    setCommentsCount(arr.length);
  }, []);

  const highlight = (text?: string, query?: string): React.ReactNode => {
    if (!query || !text) return text || '';
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="highlight">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  const authorName = isLocal
    ? (post as LocalPost).author || 'You'
    : `User ${(post as ApiPost).userId || '?'}`;
  const handle = isLocal
    ? `@${((post as LocalPost).authorEmail || 'you').split('@')[0]}`
    : `@user${(post as ApiPost).userId || '0'}`;
  const avatarSrc =
    isLocal && (post as LocalPost).authorAvatar
      ? (post as LocalPost).authorAvatar
      : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

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
            <button
              className={`action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <span className="action-icon-wrap">{liked ? '❤️' : '🤍'}</span>
              <span className="action-count">{likesCount}</span>
            </button>
            <button
              className="action-btn comment-btn"
              onClick={() => setShowComments((p) => !p)}
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
          post={post}
          initialComments={comments}
          onCommentsUpdate={handleCommentsUpdate}
          isApiPost={!isLocal}
        />
      )}
    </article>
  );
}

export default memo(PostCard);