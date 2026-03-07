require('dotenv').config();
const { Redis } = require('@upstash/redis');
const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
redis.ping().then(r => console.log('REDIS OK:', r)).catch(e => console.log('REDIS FAIL:', e.message));
