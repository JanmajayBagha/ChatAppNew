require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message');

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));

// connect DB
mongoose.connect(process.env.MONGO_URI).then(()=>console.log('mongo connected'))
  .catch(err=>console.error(err));

// socket handling
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('user:online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit('users:update', Array.from(onlineUsers.keys()));
  });

  socket.on('send:message', async (data) => {
    // data: { sender, recipient, text }
    const msg = new Message({ sender: data.sender, recipient: data.recipient, text: data.text });
    await msg.save();
    // emit to recipient if online
    const recipSocket = onlineUsers.get(data.recipient);
    if (recipSocket) io.to(recipSocket).emit('receive:message', msg);
    // also ack sender
    socket.emit('message:sent', msg);
  });

  socket.on('disconnect', async () => {
    // remove from onlineUsers
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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log('Server listening', PORT));
