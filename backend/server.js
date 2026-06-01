const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db'); 
const authRoutes = require('./routes/authRoutes');

const app = express();

connectDB(); 

// Middleware
app.use(cors({origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes); 

// Test route
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});