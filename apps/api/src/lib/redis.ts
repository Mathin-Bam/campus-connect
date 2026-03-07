import { Redis } from '@upstash/redis'

// Convert redis:// URL to https:// if needed (Render uses redis://, Upstash client needs https://)
function getRedisUrl(): string {
  const url = process.env.REDIS_URL || ''
  if (url.startsWith('redis://') || url.startsWith('rediss://')) {
    // Extract hostname from redis://default:token@hostname:port
    const match = url.match(/@([^:]+):/)
    if (match) {
      return `https://${match[1]}`
    }
  }
  return url
}

export const redis = new Redis({
  url: getRedisUrl(),
  token: process.env.REDIS_TOKEN!,
})
