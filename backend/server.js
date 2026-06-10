import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import floorRoutes from './routes/floorRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initDB } from './config/db.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if(userId) {
    socket.join(`user_${userId}`); // Room for private user notifications
  }
  
  socket.on('join_floor', (floorId) => {
    socket.join(`floor_${floorId}`);
  });
  
  socket.on('leave_floor', (floorId) => {
    socket.leave(`floor_${floorId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Database before starting the server
initDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT} and DB connected.`));
}).catch(err => {
    console.error("Failed to connect to Database. Exiting.");
    process.exit(1);
});
