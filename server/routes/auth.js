const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post(
  '/register',
  authRateLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/preferences',
  authenticate,
  [
    body('defaultMode').optional().isIn(['focus', 'research', 'quick', 'pro']),
    body('theme').optional().isIn(['light', 'dark', 'system']),
  ],
  authController.updatePreferences
);

module.exports = router;
