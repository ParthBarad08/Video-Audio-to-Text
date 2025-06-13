const http = require('http').createServer();
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

io.on('connection', socket => {
  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });
  socket.on('join', () => {
    socket.emit('your-id', socket.id);
  });
});

http.listen(5001, () => console.log('Signaling server running on port 5001'));