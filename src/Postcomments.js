import { useState, useEffect } from "react";

function PostComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`)
            .then(response => response.json())
            .then(data => {
                setComments(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Error fetching comments');
                setLoading(false);
            });
    }, [postId]);

    if (loading) return <p>Loading comments...</p>;
    if (error) return <p>{error}</p>;
    if (comments.length === 0) return <p>No comments found.</p>;

    return (
        <div style={{
            marginTop: '5px',
            borderTop: '1px solid #eff3f4',
        }}>
            {comments.map(comment => (
                <div key={comment.id} style={{
                    display: 'flex', gap: '10px', marginBottom: '12px',
                }}>

                    {/* Bubble */}
                    <div style={{
                        background: 'rgb(201 201 201)',
                        borderRadius: '0 12px 12px 12px',
                        padding: '8px 12px', flex: 1,
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f1419', paddingBottom: '7px' }}>
                            {comment.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#536471', paddingBottom: '7px' }}>
                            {comment.email}
                        </div>
                        <div style={{ fontSize: '13px', color: '#0f1419', lineHeight: '1.45'}}>
                            {comment.body}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default PostComments;