const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const FileModel = require('../models/File');
const { storeFileEmbeddings, deleteFileEmbeddings } = require('../services/vectorService');
const { streamAnswer } = require('../services/aiService');
const logger = require('../utils/logger');

// Ensure upload dir exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, DOCX, TXT, and MD files are allowed'));
  },
});

async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  throw new Error('Unsupported file type');
}

// Upload and process file
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  const fileRecord = await FileModel.create({
    user: req.user._id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: req.file.path,
    vectorNamespace: `user_${req.user._id}`,
    status: 'processing',
  });

  res.status(202).json({ file: fileRecord, message: 'Processing started' });

  // Process asynchronously
  (async () => {
    try {
      const text = await extractText(req.file.path, req.file.mimetype);
      const chunkCount = await storeFileEmbeddings(
        fileRecord._id.toString(),
        req.user._id.toString(),
        text,
        { fileName: req.file.originalname }
      );

      await FileModel.findByIdAndUpdate(fileRecord._id, {
        status: 'ready',
        chunkCount,
      });
      logger.info(`File processed: ${req.file.originalname}, ${chunkCount} chunks`);
    } catch (err) {
      logger.error('File processing error:', err);
      await FileModel.findByIdAndUpdate(fileRecord._id, {
        status: 'error',
        errorMessage: err.message,
      });
    }
  })();
});

// Query a file
router.post('/query', authenticate, async (req, res, next) => {
  try {
    const { query, fileId } = req.body;
    if (!query || !fileId) return res.status(400).json({ error: 'Query and fileId required' });

    const { queryFileEmbeddings } = require('../services/vectorService');
    const chunks = await queryFileEmbeddings(query, req.user._id.toString(), fileId);

    if (chunks.length === 0) {
      return res.json({ answer: 'No relevant content found in the document for your query.' });
    }

    const sources = chunks.map(c => ({
      title: 'Document Extract',
      url: '#',
      snippet: c.text,
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    await streamAnswer({
      query,
      sources,
      mode: 'research',
      onChunk: (chunk) => {
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      onDone: () => {
        res.write(`event: done\ndata: {}\n\n`);
        res.end();
      },
    });
  } catch (err) { next(err); }
});

// List user files
router.get('/', authenticate, async (req, res, next) => {
  try {
    const files = await FileModel.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-storagePath');
    res.json({ files });
  } catch (err) { next(err); }
});

// Get file status
router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    const file = await FileModel.findOne({ _id: req.params.id, user: req.user._id })
      .select('status chunkCount errorMessage');
    if (!file) return res.status(404).json({ error: 'Not found' });
    res.json({ file });
  } catch (err) { next(err); }
});

// Delete file
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const file = await FileModel.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    // Delete from vector DB
    await deleteFileEmbeddings(file._id.toString(), req.user._id.toString());

    // Delete from disk
    if (file.storagePath && fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }

    await file.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});
// Image generation proxy
router.get('/image-proxy', async (req, res) => {
  try {
    const { prompt, width, height, seed } = req.query;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width || 512}&height=${height || 512}&seed=${seed || 1}&nologo=true`;

    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const response = await fetch(url, { timeout: 60000 });

    if (!response.ok) throw new Error('Image fetch failed');

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

module.exports = router;
