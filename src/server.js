// server.js
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcryptjs'); // For password hashing

const app      = express();
const POSTS_FILE = path.join(__dirname, 'posts.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

// Initialize JSON files if they don't exist
if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
  // Create default users
  const defaultUsers = [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      password: bcrypt.hashSync('demo123', 10), // Hashed password
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

// Helper function to read users
const getUsers = () => {
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
};

// Helper function to save users
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Helper function to read posts
const getPosts = () => {
  const data = fs.readFileSync(POSTS_FILE, 'utf-8');
  return JSON.parse(data);
};

// Helper function to save posts
const savePosts = (posts) => {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation
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
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    name: name,
    email: email,
    password: bcrypt.hashSync(password, 10), // Hash password
    avatar: `https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png`,
    joinDate: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Login user
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
  
  // Check password
  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Get all users (for admin, optional)
app.get('/api/users', (req, res) => {
  const users = getUsers();
  const usersWithoutPassword = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPassword);
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ============ POST ROUTES ============

// Get all posts
app.get('/local-posts', (req, res) => {
  const posts = getPosts();
  res.json(posts);
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
    local: true,
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: []
  };
  posts.push(newPost);
  savePosts(posts);
  res.json(newPost);
});

// Delete post
app.delete('/local-posts/:id', (req, res) => {
  let posts = getPosts();
  const postId = parseInt(req.params.id);
  posts = posts.filter(post => post.id !== postId);
  savePosts(posts);
  res.json({ message: 'Post deleted successfully' });
});

// Like/Unlike post
app.patch('/local-posts/:id/like', (req, res) => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
  savePosts(posts);
  res.json({ likes: posts[postIndex].likes });
});

// Add comment to post
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
    body: req.body.body,
    createdAt: new Date().toISOString()
  };
  
  if (!posts[postIndex].comments) {
    posts[postIndex].comments = [];
  }
  
  posts[postIndex].comments.push(newComment);
  savePosts(posts);
  res.json(newComment);
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
  console.log('📝 API endpoints:');
  console.log('   POST   /api/register     - Register new user');
  console.log('   POST   /api/login        - Login user');
  console.log('   GET    /api/users        - Get all users');
  console.log('   GET    /local-posts      - Get all posts');
  console.log('   POST   /local-posts      - Create new post');
  console.log('   DELETE /local-posts/:id  - Delete post');
  console.log('   PATCH  /local-posts/:id/like - Like post');
  console.log('   POST   /local-posts/:id/comments - Add comment');
});