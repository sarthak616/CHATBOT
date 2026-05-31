const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  snippet: String,
  favicon: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: [sourceSchema],
  mode: {
    type: String,
    enum: ['focus', 'research', 'quick', 'pro'],
    default: 'research',
  },
  tokensUsed: Number,
  latencyMs: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Search',
    maxlength: 200,
  },
  messages: [messageSchema],
  mode: {
    type: String,
    enum: ['focus', 'research', 'quick', 'pro'],
    default: 'research',
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  fileContext: {
    fileId: String,
    fileName: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  // Auto-generate title from first user message
  if (this.messages.length === 1 && this.messages[0].role === 'user') {
    const firstMsg = this.messages[0].content;
    this.title = firstMsg.length > 80 ? firstMsg.substring(0, 77) + '...' : firstMsg;
  }
  next();
});

conversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
