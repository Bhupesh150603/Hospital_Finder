import { Redis } from "@upstash/redis";

let rawRedis = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    rawRedis = Redis.fromEnv();
  }
} catch (err) {
  console.warn('[Redis] Failed to initialize Upstash client from env:', err.message);
}

// In-memory fallback store for local development or if remote Redis is unreachable
const memoryStore = new Map();

export const redis = {
  async get(key) {
    if (rawRedis) {
      try {
        const result = await Promise.race([
          rawRedis.get(key),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000)),
        ]);
        if (result !== null && result !== undefined) {
          return result;
        }
      } catch (err) {
        // Fall back to local memory store on network error or timeout
      }
    }
    return memoryStore.get(key) || null;
  },

  async set(key, value) {
    // Update local memory store immediately for zero-lag local responsiveness
    memoryStore.set(key, value);

    if (rawRedis) {
      try {
        await Promise.race([
          rawRedis.set(key, value),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000)),
        ]);
      } catch (err) {
        console.warn(`[Redis] Network timeout reaching Upstash for ${key}. Stored in local fallback.`);
      }
    }
    return 'OK';
  },
};
