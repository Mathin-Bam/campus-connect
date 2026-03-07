import 'dotenv/config';
import { validateEnv } from './config/env';
validateEnv();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { redis } from './lib/redis';
import { prisma } from './lib/prisma';
import universitiesRouter from './routes/universities';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import chatRouter from './routes/chat';
import activityRouter from './routes/activity';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

// Redis adapter for horizontal scaling
const pubClient = redis;
const subClient = redis;
io.adapter(createAdapter(pubClient as any, subClient as any));

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/universities', universitiesRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/activity', activityRouter);

// Health check
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  let redisOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  try {
    await redis.ping();
    redisOk = true;
  } catch {}
  res.json({ status: 'ok', db: dbOk, redis: redisOk, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join a chat thread room
  socket.on('join_chat', ({ threadId }: { threadId: string }) => {
    socket.join(`thread_${threadId}`);
    console.log(`Socket ${socket.id} joined thread_${threadId}`);
  });

  // Send a message via socket
  socket.on('send_message', async ({ threadId, content, senderId }) => {
    try {
      const message = await prisma.message.create({
        data: { threadId, senderId, content },
      });
      await prisma.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });
      // Emit to ALL in thread room including sender (for multi-device)
      io.to(`thread_${threadId}`).emit('message_received', {
        threadId,
        message: {
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
          readAt: null,
        },
      });
    } catch (err) {
      console.error('Error sending message via socket:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('message_read', async ({ threadId, messageId }) => {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
      });
      io.to(`thread_${threadId}`).emit('message_read_receipt', { messageId });
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  });

  // Typing indicator — debounced on client side
  socket.on('user_typing', ({ threadId, userId }) => {
    socket.to(`thread_${threadId}`).emit('typing_indicator', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

export { io };
