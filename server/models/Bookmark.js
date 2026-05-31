const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  query: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  sources: [{
    title: String,
    url: String,
    snippet: String,
  }],
  tags: [String],
  note: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookmarkSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
