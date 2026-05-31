const logger = require('../utils/logger');

// Simple in-memory cache as fallback
const memCache = new Map();
const TTL_MAP = new Map();

let redisClient = null;

async function initRedis() {
  if (!process.env.REDIS_URL) return;
  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err.message);
      redisClient = null;
    });
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable, using in-memory cache:', err.message);
  }
}

initRedis();

async function get(key) {
  try {
    if (redisClient) {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    }
    // In-memory fallback
    if (memCache.has(key)) {
      if (TTL_MAP.has(key) && Date.now() > TTL_MAP.get(key)) {
        memCache.delete(key);
        TTL_MAP.delete(key);
        return null;
      }
      return memCache.get(key);
    }
    return null;
  } catch {
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  try {
    if (redisClient) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    memCache.set(key, value);
    TTL_MAP.set(key, Date.now() + ttlSeconds * 1000);
    // Limit in-memory cache size
    if (memCache.size > 500) {
      const firstKey = memCache.keys().next().value;
      memCache.delete(firstKey);
      TTL_MAP.delete(firstKey);
    }
  } catch (err) {
    logger.warn('Cache set error:', err.message);
  }
}

async function del(key) {
  if (redisClient) await redisClient.del(key);
  memCache.delete(key);
}

function cacheKey(prefix, ...parts) {
  return `nexus:${prefix}:${parts.join(':')}`;
}

module.exports = { get, set, del, cacheKey };
