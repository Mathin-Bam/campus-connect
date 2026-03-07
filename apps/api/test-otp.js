require('dotenv').config();
const { Redis } = require('@upstash/redis');
const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
async function test() {
  await redis.set('test:otp', '123456', { ex: 60 });
  const val = await redis.get('test:otp');
  console.log('OTP SET AND GET:', val);
  await redis.del('test:otp');
}
test().catch(e => console.log('ERROR:', e.message));
