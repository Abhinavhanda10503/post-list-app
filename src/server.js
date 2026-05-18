// server.js
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const FILE     = path.join(__dirname, 'posts.json');

app.use(cors());
app.use(express.json());

// make sure posts.json exists
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify([], null, 2));
}

// GET — return all saved posts from file
app.get('/local-posts', (req, res) => {
  const data = fs.readFileSync(FILE, 'utf-8');
  res.json(JSON.parse(data));
});

// POST — save new post to file
app.post('/local-posts', (req, res) => {
  const data     = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const newPost  = {
    id:    Date.now(),          // unique id using timestamp
    title: req.body.title,
    body:  req.body.body,
    local: true,                // flag so we know it came from the form
  };
  data.push(newPost);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json(newPost);
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));

