const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db'); 

const app = express();

connectDB(); 

// Middleware
app.use(cors({
  origin: '*' // We'll restrict this to your Vercel URL later
}));
app.use(express.json());

// Test route
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});