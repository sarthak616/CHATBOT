const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = process.env.OPENAI_MODEL || 'llama3-8b-8192';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002';

function buildSystemPrompt(mode, hasSources) {
  const base = `You are Nexus, an advanced AI search assistant. You provide accurate, well-structured answers.
Always cite sources by referencing them with [Source N] notation when you use information from them.
Be factual, concise, and helpful. Today's date: ${new Date().toLocaleDateString()}.`;

  const modeInstructions = {
    focus: `${base}
Give a direct, clean answer without extensive markdown formatting. Focus on the key insight.`,
    research: `${base}
Provide a comprehensive, well-structured answer with:
- Clear sections with headers
- Key facts and insights
- Proper citation of sources
- A brief summary at the end`,
    quick: `${base}
Give a very brief, direct answer in 2-3 sentences maximum. No fluff.`,
    pro: `${base}
Use chain-of-thought reasoning. Break down the problem step by step:
1. Analyze the question
2. Consider multiple angles
3. Synthesize information from sources
4. Provide a nuanced, expert-level answer
5. Note any uncertainties or caveats`,
  };

  return modeInstructions[mode] || modeInstructions.research;
}

function buildContextFromSources(sources) {
  if (!sources || sources.length === 0) return '';
  return sources
    .map((s, i) => `[Source ${i + 1}]: ${s.title}\nURL: ${s.url}\n${s.snippet}`)
    .join('\n\n---\n\n');
}

async function streamAnswer({ query, sources = [], history = [], mode = 'research', onChunk, onDone }) {
  const systemPrompt = buildSystemPrompt(mode, sources.length > 0);
  const context = buildContextFromSources(sources);

  const userMessage = context
    ? `Context from web search:\n\n${context}\n\n---\n\nUser question: ${query}`
    : query;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
    temperature: mode === 'quick' ? 0.3 : mode === 'pro' ? 0.7 : 0.5,
    max_tokens: mode === 'quick' ? 300 : mode === 'pro' ? 2000 : 1000,
  });

  let fullText = '';
  let tokensUsed = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullText += delta;
      onChunk?.(delta);
    }
    if (chunk.usage) {
      tokensUsed = chunk.usage.total_tokens;
    }
  }

  onDone?.({ fullText, tokensUsed });
  return { fullText, tokensUsed };
}

async function generateEmbeddings(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function generateBatchEmbeddings(texts) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map(d => d.embedding);
}

async function generateTitle(query) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Generate a concise, descriptive title (max 8 words) for a conversation that starts with this question: "${query}". Return only the title, no quotes.`,
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });
    return response.choices[0].message.content.trim();
  } catch {
    return query.substring(0, 60);
  }
}

module.exports = {
  streamAnswer,
  generateEmbeddings,
  generateBatchEmbeddings,
  generateTitle,
};