let ioInstance;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Da ket noi Socket.IO backend' });
  });

  return ioInstance;
};

export const getSocket = () => ioInstance;
