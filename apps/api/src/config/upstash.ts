import Redis from 'ioredis';
import { env } from './env';

// Upstash Redis configuration
export const upstashRedis = new Redis({
  host: 'tough-duck-63678.upstash.io',
  port: 6379,
  password: 'Afi-AAIncDI4YjE0NzZkMzE5NGQ0YjQ3YTg0OTFlYTYwMmUxN2UwMXAyNjM2Nzg',
  tls: {}, // Required for Upstash
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Alternative: Use REST URL for Upstash
export const upstashRestUrl = env.UPSTASH_REDIS_REST_URL || 'https://tough-duck-63678.upstash.io';
export const upstashToken = env.UPSTASH_REDIS_TOKEN || 'Afi-AAIncDI4YjE0NzZkMzE5NGQ0YjQ3YTg0OTFlYTYwMmUxN2UwMXAyNjM2Nzg';

// Helper function for Upstash REST API calls
export async function upstashRestCommand(command: string, ...args: string[]) {
  const response = await fetch(`${upstashRestUrl}/${command}/${args.join('/')}`, {
    headers: {
      Authorization: `Bearer ${upstashToken}`,
    },
  });
  return response.json();
}

export default upstashRedis;
export const redis = upstashRedis;
