const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// In-memory store (replace with Redis for production multi-instance)
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

const searchRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.SEARCH_RATE_LIMIT_PER_HOUR) || 20,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
  message: { error: 'Search limit reached. Upgrade to Pro for unlimited searches.' },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

module.exports = { globalRateLimiter, searchRateLimiter, authRateLimiter };
