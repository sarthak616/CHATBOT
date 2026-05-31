const { fetchSearchResults } = require('../services/searchService');
const { streamAnswer, generateTitle } = require('../services/aiService');
const { queryFileEmbeddings } = require('../services/vectorService');
const { get, set, cacheKey } = require('../services/cacheService');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.search = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const {
      query,
      mode = 'research',
      conversationId,
      fileId,
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const trimmedQuery = query.trim().substring(0, 500);

    // ─── SSE Setup ──────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // ─── Load conversation history ───────────────────────────────────────────
    let conversation = null;
    let history = [];

    if (conversationId && req.user) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
      if (conversation) {
        history = conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
        }));
      }
    }

    // ─── Fetch Sources ───────────────────────────────────────────────────────
    let sources = [];

    if (mode !== 'focus') {
      // Check cache for search results
      const searchCacheKey = cacheKey('search', trimmedQuery, mode);
      const cachedSources = await get(searchCacheKey);

      if (cachedSources) {
        sources = cachedSources;
        logger.debug(`Cache hit for query: "${trimmedQuery}"`);
      } else {
        const numResults = mode === 'quick' ? 3 : mode === 'pro' ? 8 : 5;
        sources = await fetchSearchResults(trimmedQuery, numResults);
        if (sources.length > 0) {
          await set(searchCacheKey, sources, 300); // Cache 5 minutes
        }
      }

      // If fileId is provided, augment with vector search results
      if (fileId && req.user) {
        const fileChunks = await queryFileEmbeddings(trimmedQuery, req.user._id.toString(), fileId);
        if (fileChunks.length > 0) {
          const fileSources = fileChunks.map(chunk => ({
            title: 'Uploaded Document',
            url: '#',
            snippet: chunk.text,
            favicon: '',
            fromFile: true,
          }));
          sources = [...fileSources, ...sources];
        }
      }

      sendEvent('sources', { sources });
    }

    // ─── Stream AI Answer ────────────────────────────────────────────────────
    let fullAnswer = '';
    let tokensUsed = 0;

    await streamAnswer({
      query: trimmedQuery,
      sources,
      history,
      mode,
      onChunk: (chunk) => {
        sendEvent('chunk', { text: chunk });
      },
      onDone: ({ fullText, tokensUsed: tokens }) => {
        fullAnswer = fullText;
        tokensUsed = tokens;
      },
    });

    const latencyMs = Date.now() - startTime;

    // ─── Save to DB ──────────────────────────────────────────────────────────
    if (req.user) {
      try {
        if (!conversation) {
          conversation = new Conversation({
            user: req.user._id,
            mode,
            messages: [],
          });
        }

        conversation.messages.push({
          role: 'user',
          content: trimmedQuery,
          mode,
        });

        conversation.messages.push({
          role: 'assistant',
          content: fullAnswer,
          sources: sources.slice(0, 8),
          mode,
          tokensUsed,
          latencyMs,
        });

        if (fileId) {
          conversation.fileContext = { fileId };
        }

        await conversation.save();

        // Update user search count
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { searchCount: 1 },
          lastSearchAt: new Date(),
        });

        sendEvent('done', {
          conversationId: conversation._id,
          tokensUsed,
          latencyMs,
        });
      } catch (dbErr) {
        logger.error('Failed to save conversation:', dbErr);
        sendEvent('done', { latencyMs });
      }
    } else {
      sendEvent('done', { latencyMs });
    }

    res.end();
  } catch (err) {
    logger.error('Search error:', err);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Search failed' })}\n\n`);
      res.end();
    } catch (_) {
      next(err);
    }
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ user: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title mode isBookmarked createdAt updatedAt messages')
        .lean(),
      Conversation.countDocuments({ user: req.user._id }),
    ]);

    // Return summary (not full messages)
    const summaries = conversations.map(c => ({
      _id: c._id,
      title: c.title,
      mode: c.mode,
      isBookmarked: c.isBookmarked,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content?.substring(0, 100),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({
      conversations: summaries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    await Conversation.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
