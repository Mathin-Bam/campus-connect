import { env } from './config/env';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { z } from 'zod';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Redis clients for Socket.io adapter
const pubClient = new Redis(env.REDIS_URL);
const subClient = pubClient.duplicate();

// Initialize Socket.io with Redis adapter
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  adapter: createAdapter(pubClient, subClient),
});

// Initialize clients
const prisma = new PrismaClient();
const redis = new Redis(env.REDIS_URL);

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
    await prisma.$queryRaw`SELECT 1`;
    db = true;
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

// Example API route
app.post('/api/users', async (req, res) => {
  try {
    const userSchema = z.object({
      email: z.string().email(),
      name: z.string().optional(),
    });

    const { email, name } = userSchema.parse(req.body);

    const user = await prisma.user.create({
      data: { email, name },
    });

    // Cache user in Redis
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user));

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  await prisma.$disconnect();
  await redis.quit();
  await pubClient.quit();
  await subClient.quit();
  process.exit(0);
});
