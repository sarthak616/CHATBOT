// routes/conversations.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Conversation = require('../models/Conversation');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('title mode isBookmarked createdAt updatedAt');
    res.json({ conversations });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json({ conversation });
  } catch (err) { next(err); }
});

router.patch('/:id/bookmark', authenticate, async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    conversation.isBookmarked = !conversation.isBookmarked;
    await conversation.save();
    res.json({ isBookmarked: conversation.isBookmarked });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Conversation.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
