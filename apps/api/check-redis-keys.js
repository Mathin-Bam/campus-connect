require('dotenv').config();
const { Redis } = require('@upstash/redis');
const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
async function check() {
  const keys = await redis.keys('*');
  console.log('ALL REDIS KEYS:', JSON.stringify(keys));
  for (const key of keys) {
    const val = await redis.get(key);
    console.log(key, '->', val);
  }
}
check().catch(e => console.log('ERROR:', e.message));
