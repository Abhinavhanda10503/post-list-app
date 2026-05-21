import { useState, useEffect, useCallback } from 'react'
import PostCard from '../Postcard/PostCard';
import './PostList.css';

const LIMIT = 8;

function PostList({ localPosts, searchQuery }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;

  const goToPrev = useCallback(() => setCurrentPage(p => p - 1), [])
  const goToNext = useCallback(() => setCurrentPage(p => p + 1), [])

  useEffect(() => {
    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/posts?_page=${currentPage}&_limit=${LIMIT}`)
      .then(res => res.json())
      .then(postsData => {
        const promises = postsData.map(post =>
          fetch(`https://jsonplaceholder.typicode.com/posts/${post.id}/comments`)
            .then(res => res.json())
            .then(comments => ({ ...post, commentsData: comments, commentsCount: comments.length }))
        );
        return Promise.all(promises);
      })
      .then(withComments => {
        setPosts(withComments);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load posts.');
        setLoading(false);
      });
  }, [currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const allPosts = [...localPosts, ...posts];
  const filteredPosts = searchQuery
    ? allPosts.filter(p =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allPosts;

  // page dots — show 5 around current
  const dotRange = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + i;
  });

  return (
    <div className="post-list">

      {searchQuery && (
        <div className="search-results-bar">
          🔍 {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {error && <div className="error-banner">⚠ {error}</div>}

      {loading && filteredPosts.length === 0 ? (
        <div className="feed-loading">
          <div className="feed-spinner" />
          <span style={{ fontSize: 14 }}>Loading posts…</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <h3>Nothing found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <>
          {filteredPosts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              searchQuery={searchQuery}
              isLocal={localPosts.some(lp => lp.id === post.id)}
              initialComments={post.commentsData || []}
              initialCommentsCount={post.commentsCount || 0}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}

          <div className="pagination-bar">
            <button
              className="page-nav-btn"
              onClick={goToPrev}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>

            <div className="page-indicator">
              {dotRange.map(n => (
                <div
                  key={n}
                  className={`page-dot ${n === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(n)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>

            <button
              className="page-nav-btn"
              onClick={goToNext}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>

        </>
      )}
    </div>
  );
}

export default PostList;