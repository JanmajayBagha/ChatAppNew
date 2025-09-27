require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message');

// ----------------- CORS Setup -----------------
const allowedOrigins = [
  'https://chat-app-new-ecru.vercel.app',
  'https://chat-app-q9yep1xhk-janmajay-baghas-projects.vercel.app',
  'http://localhost:5173', // local dev
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS not allowed from this origin'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ----------------- API Routes -----------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));

// ----------------- MongoDB Connection -----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ----------------- Socket.IO -----------------
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) return callback(new Error('CORS not allowed'), false);
      return callback(null, true);
    },
    methods: ['GET', 'POST']
  }
});

const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User comes online
  socket.on('user:online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit('users:update', Array.from(onlineUsers.keys()));
  });

  // Send a message
  socket.on('send:message', async (data) => {
    const msg = new Message({
      sender: data.sender,
      recipient: data.recipient,
      text: data.text
    });
    await msg.save();

    // Emit to recipient if online
    const recipSocket = onlineUsers.get(data.recipient);
    if (recipSocket) io.to(recipSocket).emit('receive:message', msg);

    // Ack to sender
    socket.emit('message:sent', msg);
  });

  // Disconnect
  socket.on('disconnect', async () => {
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { online: false });
        io.emit('users:update', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
