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
      name: "You",
      email: "you@example.com",
      body: newComment,
      isNew: true
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    setNewComment("");
    if (onCommentsUpdate) onCommentsUpdate(updatedComments);
  };

  return (
    <div className="comments-section">
      {/* Compose */}
      <div className="comment-compose">
        <div className="comment-compose-avatar">Y</div>
        <div className="comment-compose-right">
          <input
            className="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment(e);
              }
            }}
            placeholder="Write a reply..."
          />
          <div className="comment-input-footer">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Press Enter to send
            </span>
            <button
              className="comment-submit"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {comments.length === 0 ? (
        <p className="no-comments">No replies yet</p>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">👤</div>
              <div className="comment-body-col">
                <div className="comment-author-row">
                  <span className="comment-name">{comment.name}</span>
                  <span className="comment-email">{comment.email}</span>
                  {comment.isNew && <span className="new-badge">new</span>}
                </div>
                <p className="comment-text">{comment.body}</p>
                <div className="comment-actions">
                  <button className="comment-action-btn">Like</button>
                  <button className="comment-action-btn">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostComments;