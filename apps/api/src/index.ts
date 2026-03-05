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
import { redis } from './config/upstash';
import { prisma } from './config/database';
import universitiesRouter from './routes/universities';
import authRouter from './routes/auth';
import usersRouter from './routes/users';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

// Redis adapter for horizontal scaling
const pubClient = redis.duplicate ? redis.duplicate() : redis;
const subClient = redis.duplicate ? redis.duplicate() : redis;
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

export { io };
