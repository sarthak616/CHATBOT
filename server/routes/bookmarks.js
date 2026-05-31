const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Bookmark = require('../models/Bookmark');

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { query, answer, sources, conversationId, tags, note } = req.body;
    if (!query || !answer) return res.status(400).json({ error: 'Query and answer required' });

    const bookmark = await Bookmark.create({
      user: req.user._id,
      conversation: conversationId,
      query,
      answer,
      sources: sources || [],
      tags: tags || [],
      note,
    });
    res.status(201).json({ bookmark });
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ bookmarks });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Bookmark.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
