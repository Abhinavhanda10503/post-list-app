// server.js
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const FILE     = path.join(__dirname, 'posts.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify([], null, 2));
}

app.get('/local-posts', (req, res) => {
  const data = fs.readFileSync(FILE, 'utf-8');
  res.json(JSON.parse(data));
});

app.post('/local-posts', (req, res) => {
  const data     = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const newPost  = {
    id:    Date.now(),         
    title: req.body.title,
    body:  req.body.body,
    local: true,               
  };
  data.push(newPost);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json(newPost);
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));

