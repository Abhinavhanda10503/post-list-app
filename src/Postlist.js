import { useState, useEffect } from 'react';
import PostComments from './Postcomments';

const LIMIT = 5; 

function PostList({ localPosts }) {
    const [apiPosts, setApiPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 20; 

    
    useEffect(() => {
        setLoading(true);

        fetch(`https://jsonplaceholder.typicode.com/posts?_page=${currentPage}&_limit=${LIMIT}`)
            .then(res => res.json())
            .then(data => {
                setApiPosts(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Error fetching posts.');
                setLoading(false);
            });
    }, [currentPage]); 

    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    const allPosts = [...localPosts, ...apiPosts];
    const pageBtn = (disabled) => ({
        padding: '8px 18px',
        borderRadius: '20px',
        border: '1px solid #cfd9de',
        background: disabled ? '#f7f9f9' : '#fff',
        color: disabled ? '#cfd9de' : '#0f1419',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: 'inherit',
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Post list */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul style={{ padding: 0 }}>
                    {allPosts.map(post => (
                        // Post card
                        <li
                            key={post.id}
                            style={{
                                listStyle: 'none',
                                background: 'rgb(114 114 114)',
                                borderBottom: '1px solid #eff3f4',
                                padding: '16px 20px', borderRadius: '30px',
                                marginBottom: '12px',
                            }}
                        >

                            {post.local && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        background: '#dcfce7', color: '#15803d',
                                        borderRadius: '20px', padding: '2px 5px', fontWeight: '600', fontSize: '12px', marginBottom: '7px',
                                    }}>
                                        Saved locally
                                    </span>
                                </div>
                            )}


                            {/* Post content */}
                            <h3 style={{
                                fontSize: '15px', fontWeight: '700',
                                color: '#0f1419', marginBottom: '6px', marginTop: '0px',
                            }}>
                                {post.title}
                            </h3>
                            <p style={{ fontSize: '15px', color: '#0f1419', lineHeight: '1.55', marginBottom: '14px' }}>
                                {post.body}
                            </p>

                            {/* Comments */}
                            <PostComments postId={post.id} />
                        </li>
                    ))}
                </ul>
            )}

            {/* Pagination controls */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '12px',
                padding: '20px', background: '#fff',
                borderTop: '1px solid #eff3f4',
            }}>
                <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    style={pageBtn(currentPage === 1)}
                >
                    ← Prev
                </button>
                <span style={{ fontSize: '13px', color: '#536471' }}>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    style={pageBtn(currentPage === totalPages)}
                >
                    Next →
                </button>
            </div>

        </div>
    );
}

export default PostList;