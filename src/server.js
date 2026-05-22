// server.js - COMPLETE UPDATED VERSION
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcryptjs');

const app = express();
const POSTS_FILE = path.join(__dirname, 'posts.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const LIKES_FILE = path.join(__dirname, 'likes.json');  // NEW: Track who liked what

app.use(cors());
app.use(express.json());

// Initialize JSON files
if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
  const defaultUsers = [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      password: bcrypt.hashSync('demo123', 10),
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      joinDate: new Date().toISOString()
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      password: bcrypt.hashSync('john123', 10),
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      joinDate: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: bcrypt.hashSync('jane123', 10),
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      joinDate: new Date().toISOString()
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
}

// Initialize likes tracking file
if (!fs.existsSync(LIKES_FILE)) {
  fs.writeFileSync(LIKES_FILE, JSON.stringify({}, null, 2));
}

// Helper functions
const getUsers = () => {
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const getPosts = () => {
  const data = fs.readFileSync(POSTS_FILE, 'utf-8');
  return JSON.parse(data);
};

const savePosts = (posts) => {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

const getLikes = () => {
  const data = fs.readFileSync(LIKES_FILE, 'utf-8');
  return JSON.parse(data);
};

const saveLikes = (likes) => {
  fs.writeFileSync(LIKES_FILE, JSON.stringify(likes, null, 2));
};

// ============ AUTHENTICATION ROUTES ============
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  const users = getUsers();
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }
  
  const newUser = {
    id: users.length + 1,
    name: name,
    email: email,
    password: bcrypt.hashSync(password, 10),
    avatar: `https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png`,
    joinDate: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email' });
  }
  
  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ============ POST ROUTES ============

// Get all posts with like info for current user
app.get('/local-posts', (req, res) => {
  const posts = getPosts();
  const userId = req.headers['user-id']; // Get user ID from headers
  const likes = getLikes();
  
  // Add like info to each post
  const postsWithLikeInfo = posts.map(post => ({
    ...post,
    isLikedByCurrentUser: userId ? (likes[post.id]?.includes(parseInt(userId)) || false) : false
  }));
  
  res.json(postsWithLikeInfo);
});

// Create new post
app.post('/local-posts', (req, res) => {
  const posts = getPosts();
  const newPost = {
    id: Date.now(),
    title: req.body.title,
    body: req.body.body,
    author: req.body.author,
    authorEmail: req.body.authorEmail,
    authorAvatar: req.body.authorAvatar,
    authorId: req.body.authorId, // NEW: Store author ID
    local: true,
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: [], // Will store comments with replies now
  };
  posts.push(newPost);
  savePosts(posts);
  res.json(newPost);
});

// Like/Unlike post with user tracking
app.patch('/local-posts/:id/like', (req, res) => {
  const posts = getPosts();
  const likes = getLikes();
  const postId = parseInt(req.params.id);
  const userId = req.body.userId; // Get user ID from request
  
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // Initialize likes tracking for this post if not exists
  if (!likes[postId]) {
    likes[postId] = [];
  }
  
  const userLikedIndex = likes[postId].indexOf(userId);
  let isLiked = false;
  
  if (userLikedIndex === -1) {
    // User likes the post
    likes[postId].push(userId);
    posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
    isLiked = true;
  } else {
    // User unlikes the post
    likes[postId].splice(userLikedIndex, 1);
    posts[postIndex].likes = (posts[postIndex].likes || 0) - 1;
    isLiked = false;
  }
  
  savePosts(posts);
  saveLikes(likes);
  
  res.json({ 
    likes: posts[postIndex].likes, 
    isLiked: isLiked 
  });
});

// Get like status for a post
app.get('/local-posts/:id/like-status', (req, res) => {
  const likes = getLikes();
  const postId = parseInt(req.params.id);
  const userId = parseInt(req.headers['user-id']);
  
  const isLiked = likes[postId]?.includes(userId) || false;
  res.json({ isLiked });
});

// Add comment to post (with reply support)
app.post('/local-posts/:id/comments', (req, res) => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const newComment = {
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    body: req.body.body,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [], // Track who liked this comment
    replies: []  // NEW: Store replies to comments
  };
  
  if (!posts[postIndex].comments) {
    posts[postIndex].comments = [];
  }
  
  posts[postIndex].comments.push(newComment);
  savePosts(posts);
  res.json(newComment);
});

// Like a comment
app.post('/local-posts/:postId/comments/:commentId/like', (req, res) => {
  const posts = getPosts();
  const postId = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const userId = req.body.userId;
  
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  if (!comment.likedBy) {
    comment.likedBy = [];
  }
  
  const userLikedIndex = comment.likedBy.indexOf(userId);
  let isLiked = false;
  
  if (userLikedIndex === -1) {
    comment.likedBy.push(userId);
    comment.likes = (comment.likes || 0) + 1;
    isLiked = true;
  } else {
    comment.likedBy.splice(userLikedIndex, 1);
    comment.likes = (comment.likes || 0) - 1;
    isLiked = false;
  }
  
  savePosts(posts);
  res.json({ likes: comment.likes, isLiked });
});

// Add reply to a comment
app.post('/local-posts/:postId/comments/:commentId/replies', (req, res) => {
  const posts = getPosts();
  const postId = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  const newReply = {
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    body: req.body.body,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: []
  };
  
  if (!comment.replies) {
    comment.replies = [];
  }
  
  comment.replies.push(newReply);
  savePosts(posts);
  res.json(newReply);
});

// Get comments for a post
app.get('/local-posts/:id/comments', (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.id === parseInt(req.params.id));
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  res.json(post.comments || []);
});

app.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});