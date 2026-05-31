const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: String,
  size: Number,
  storagePath: String,
  vectorNamespace: String,
  chunkCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', fileSchema);
