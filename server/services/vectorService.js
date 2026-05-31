const { Pinecone } = require('@pinecone-database/pinecone');
const { generateEmbeddings, generateBatchEmbeddings } = require('./aiService');
const logger = require('../utils/logger');

let pinecone = null;
let index = null;

function getPinecone() {
  if (!process.env.PINECONE_API_KEY) return null;
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    index = pinecone.index(process.env.PINECONE_INDEX || 'nexus-search-embeddings');
  }
  return { pinecone, index };
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text, maxChunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxChunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    start += maxChunkSize - overlap;
  }

  return chunks.filter(c => c.trim().length > 50);
}

/**
 * Store file embeddings in Pinecone
 */
async function storeFileEmbeddings(fileId, userId, text, metadata = {}) {
  const client = getPinecone();
  if (!client) {
    logger.warn('Pinecone not configured, skipping vector storage');
    return 0;
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const namespace = `user_${userId}`;
  const batchSize = 100;
  let totalStored = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await generateBatchEmbeddings(batch);

    const vectors = batch.map((chunk, j) => ({
      id: `${fileId}_chunk_${i + j}`,
      values: embeddings[j],
      metadata: {
        fileId,
        userId,
        text: chunk,
        chunkIndex: i + j,
        ...metadata,
      },
    }));

    await client.index.namespace(namespace).upsert(vectors);
    totalStored += vectors.length;
  }

  logger.info(`Stored ${totalStored} chunks for file ${fileId}`);
  return totalStored;
}

/**
 * Query file embeddings
 */
async function queryFileEmbeddings(query, userId, fileId = null, topK = 5) {
  const client = getPinecone();
  if (!client) return [];

  const queryEmbedding = await generateEmbeddings(query);
  const namespace = `user_${userId}`;

  const filter = fileId ? { fileId: { $eq: fileId } } : { userId: { $eq: userId } };

  const results = await client.index.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata: true,
  });

  return (results.matches || [])
    .filter(m => m.score > 0.75)
    .map(m => ({
      text: m.metadata.text,
      score: m.score,
      fileId: m.metadata.fileId,
      chunkIndex: m.metadata.chunkIndex,
    }));
}

/**
 * Delete file embeddings from Pinecone
 */
async function deleteFileEmbeddings(fileId, userId) {
  const client = getPinecone();
  if (!client) return;

  const namespace = `user_${userId}`;
  await client.index.namespace(namespace).deleteMany({ fileId: { $eq: fileId } });
  logger.info(`Deleted embeddings for file ${fileId}`);
}

module.exports = {
  storeFileEmbeddings,
  queryFileEmbeddings,
  deleteFileEmbeddings,
  chunkText,
};
