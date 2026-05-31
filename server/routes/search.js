const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { searchRateLimiter } = require('../middleware/rateLimiter');

// Main streaming search endpoint
router.post('/', optionalAuth, searchRateLimiter, searchController.search);

// Get user's search history
router.get('/history', authenticate, searchController.getHistory);

// Delete a conversation
router.delete('/:id', authenticate, searchController.deleteConversation);

module.exports = router;
