const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const messageRoutes = require('./routes/messageRoutes');


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

connectDB();

// Security middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/messages', messageRoutes);

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts, please try again later' },
});

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

// Socket.IO signaling + real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // join personal room for direct messages
  socket.on('join-user-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // handle chat message
  socket.on('send-message', (data) => {
    // send to receiver's room
    io.to(data.receiverId).emit('receive-message', data);
  });

  // video call signaling
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => socket.to(data.room).emit('offer', data));
  socket.on('answer', (data) => socket.to(data.room).emit('answer', data));
  socket.on('ice-candidate', (data) => socket.to(data.room).emit('ice-candidate', data));

  socket.on('leave-room', (roomId) => {
    socket.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});