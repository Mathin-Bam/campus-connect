import { env } from './config/env';
import { supabase } from './config/supabase';
import { upstashRedis } from './config/upstash';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { z } from 'zod';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Redis clients for Socket.io adapter using Upstash
const pubClient = upstashRedis.duplicate();
const subClient = upstashRedis.duplicate();

// Initialize Socket.io with Redis adapter
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  adapter: createAdapter(pubClient, subClient),
});

// Initialize clients
const redis = upstashRedis;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  
  // Check database connection
  let db = false;
  try {
    const { data, error } = await supabase.from('universities').select('id').limit(1);
    db = !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    db = false;
  }

  // Check Redis connection
  let redisStatus = false;
  try {
    const result = await redis.ping();
    redisStatus = result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    redisStatus = false;
  }

  res.json({
    status: 'ok',
    db,
    redis: redisStatus,
    timestamp,
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redis.quit();
  await pubClient.quit();
  await subClient.quit();
  process.exit(0);
});
