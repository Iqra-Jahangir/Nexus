const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const app = express();
const server = http.createServer(app); // 👈 wrap express in http server

// Socket.IO attached to http server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

connectDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

// Socket.IO signaling server
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // join a video call room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // notify others in the room
    socket.to(roomId).emit('user-joined', socket.id);
  });

  // WebRTC signaling — pass offer to other peer
  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data);
  });

  // WebRTC signaling — pass answer to other peer
  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data);
  });

  // WebRTC signaling — pass ICE candidates
  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data);
  });

  // user leaves the call
  socket.on('leave-room', (roomId) => {
    socket.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// use server.listen instead of app.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});