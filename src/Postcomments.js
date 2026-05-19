import { useState } from "react";
import "./PostComments.css";

function PostComments({ postId, initialComments, onCommentsUpdate }) {
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      name: "Current User",
      email: "user@example.com",
      body: newComment,
      isNew: true 
    };
    
    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    setNewComment("");
    
    if (onCommentsUpdate) {
      onCommentsUpdate(updatedComments);
    }
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="comments-section">
        <div className="comments-header">
          <h4>Comments (0)</h4>
        </div>
        <form onSubmit={handleAddComment} className="comment-form">
          <div className="comment-input-wrapper">
            <div className="comment-avatar-small">👤</div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
            />
            <button type="submit" className="comment-submit">
              Post
            </button>
          </div>
        </form>
        <p className="no-comments">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h4>Comments ({comments.length})</h4>
      </div>

      <form onSubmit={handleAddComment} className="comment-form">
        <div className="comment-input-wrapper">
          <div className="comment-avatar-small">👤</div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="comment-input"
          />
          <button type="submit" className="comment-submit">
            Post
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className={`comment-item ${comment.isNew ? 'new-comment' : ''}`}>
            <div className="comment-avatar">👤</div>
            <div className="comment-content">
              <div className="comment-author">
                {comment.name}
                <span className="comment-email">{comment.email}</span>
                {comment.isNew && <span className="new-badge">New</span>}
              </div>
              <div className="comment-body">{comment.body}</div>
              <div className="comment-actions-small">
                <button className="comment-like-btn">Like</button>
                <button className="comment-reply-btn">Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostComments;