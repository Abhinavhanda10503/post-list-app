import { useState, useEffect, useCallback } from 'react'
import PostCard from './PostCard';
import './PostList.css';

const LIMIT = 5;


function PostList({ localPosts, searchQuery }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 20;
  const goToPrev = useCallback(() => {

    setCurrentPage(p => p - 1)
  
  }, [])
  
  
  const goToNext = useCallback(() => {
  
    setCurrentPage(p => p + 1)
  
  }, [])

  useEffect(() => {
    setLoading(true);

    
    fetch(`https://jsonplaceholder.typicode.com/posts?_page=${currentPage}&_limit=${LIMIT}`)
      .then(res => res.json())
      .then(postsData => {
       
        const promises = postsData.map(post =>
          fetch(`https://jsonplaceholder.typicode.com/posts/${post.id}/comments`)
            .then(res => res.json())
            .then(comments => ({
              ...post,
              commentsData: comments,  
              commentsCount: comments.length
            }))
        );

        return Promise.all(promises);
      })
      .then(postsWithComments => {
        setPosts(postsWithComments);
        setLoading(false);
      })
      .catch(() => {
        setError('Error fetching posts.');
        setLoading(false);
      });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (error) return <div className="error-message">{error}</div>;

  const allPosts = [...localPosts, ...posts];

  const filteredPosts = searchQuery
    ? allPosts.filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allPosts;

  return (
    <div className="post-list-container">
      {searchQuery && (
        <div className="search-results-info">
          Found {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {loading && filteredPosts.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No posts found</h3>
          <p>Try searching for something else</p>
        </div>
      ) : (
        <>
          <div className="posts-feed">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                searchQuery={searchQuery}
                isLocal={localPosts.some(lp => lp.id === post.id)}
                initialComments={post.commentsData}  
                initialCommentsCount={post.commentsCount}  
              />
            ))}
          </div>


          <div className="pagination">
            <button
              onClick={goToPrev}
              disabled={currentPage === 1}
              className="page-btn"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="page-btn"
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