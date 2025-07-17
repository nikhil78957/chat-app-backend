const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('joinGroup', ({ groupId, username }) => {
    socket.join(groupId);
    io.to(groupId).emit('systemMessage', `${username} joined the group`);
  });

  socket.on('sendMessage', ({ groupId, username, message }) => {
    io.to(groupId).emit('receiveMessage', { username, message });
  });

  socket.on('disconnect', () => {
    console.log('🚫 User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('🚀 Chat server is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

