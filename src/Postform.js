import { useState } from 'react';

function PostForm({ onPostSaved }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(null);

        fetch('http://localhost:5000/local-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body }),
        })
            .then(res => res.json())
            .then(saved => {
                setLoading(false);
                setSuccess(true);
                setTitle('');
                setBody('');
                onPostSaved(saved);
            })
            .catch(() => {
                setLoading(false);
                setError('Could not save post.');
            });
    };

    return (
        <div style={{
            background: 'rgb(40 40 40)',
            borderBottom: '1px solid #eff3f4',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
        }}>

            {/* Input area */}
            <div style={{ flex: 1 }}>
                {success && (
                    <p style={{ color: '#16a34a', fontSize: '13px', marginBottom: '8px' }}>
                        ✓ Post saved!
                    </p>
                )}
                {error && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter post title"
                    required
                    style={{
                        width: '100%', border: 'none', outline: 'none',
                        fontSize: '16px', fontWeight: '600',
                        color: '#ffffff', background: 'transparent',
                        marginBottom: '6px', fontFamily: 'inherit', borderBottom: '1px solid #eff3f4', paddingBottom: '10px',
                    }}
                />
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="What's on your mind?"
                    required
                    rows={3}
                    style={{
                        width: '100%', border: 'none', outline: 'none',
                        resize: 'none', fontSize: '15px',
                        color: '#ffffff', background: 'transparent',
                        fontFamily: 'inherit', lineHeight: '1.5',
                    }}
                />

                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingTop: '10px',
                    borderTop: '1px solid #eff3f4',
                    marginTop: '8px',
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            background: loading ? '#93c5fd' : '#1d4ed8',
                            color: '#fff', border: 'none',
                            borderRadius: '20px', padding: '8px 20px',
                            fontSize: '14px', fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PostForm;