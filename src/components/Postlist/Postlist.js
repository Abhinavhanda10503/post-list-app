import { useState, useEffect, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import PostCard from '../Postcard/PostCard';
import './PostList.css';

const LIMIT = 8;

const GET_POSTS = gql`
  query GetPosts($page: Int!, $limit: Int!) {
    posts(page: $page, limit: $limit) {
      posts {
        id
        title
        body
        userId
        commentsCount
      }
      totalCount
    }
  }
`;

const getApiPostLikesCount = (postId, defaultCount = 0) => {
  const key = `api_post_likes_count_${postId}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved) : defaultCount;
};

function PostList({ localPosts, searchQuery }) {
  const [currentPage, setCurrentPage] = useState(1);
  const { loading, error, data } = useQuery(GET_POSTS, {
    variables: { page: currentPage, limit: LIMIT },
    fetchPolicy: 'network-only',
  });

  const [apiPosts, setApiPosts] = useState([]);
  const totalPages = data ? Math.ceil(data.posts.totalCount / LIMIT) : 1;

  useEffect(() => {
    if (data?.posts?.posts) {
      const enriched = data.posts.posts.map(post => ({
        ...post,
        commentsData: [],
        commentsCount: post.commentsCount,
        isLikedByCurrentUser: false,
        likes: getApiPostLikesCount(post.id, 0),
        local: false,
      }));
      setApiPosts(enriched);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const safeLocal = Array.isArray(localPosts) ? localPosts : [];
  const safeApi = Array.isArray(apiPosts) ? apiPosts : [];
  const all = [...safeLocal, ...safeApi];
  const displayed = searchQuery
    ? all.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : all;

  const goToPrev = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages && !searchQuery) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, searchQuery]);

  const handleLikeUpdate = (postId, likes, isLiked) => {
    setApiPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, likes, isLikedByCurrentUser: isLiked } : p))
    );
  };

  if (error) return <div className="error-banner">⚠ Could not load posts.</div>;

  return (
    <div className="post-list">
      {searchQuery && (
        <div className="search-results-bar">
          🔍 {displayed.length} result{displayed.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {loading && displayed.length === 0 ? (
        <div className="feed-loading">
          <div className="feed-spinner" />
          <span>Loading posts…</span>
        </div>
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
              <button className="page-nav-btn" onClick={goToPrev} disabled={currentPage === 1}>
                ← Prev
              </button>
              <div className="page-indicator">
                <span className="page-text">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <button className="page-nav-btn" onClick={goToNext} disabled={currentPage === totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PostList;