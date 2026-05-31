# 🔍 Nexus Search — AI-Powered Smart Search Engine

A production-ready Perplexity AI clone with RAG pipeline, streaming responses, conversational memory, and a beautiful modern UI.

![Nexus Search](docs/screenshot-placeholder.png)

## ✨ Features

- **AI-Powered Answers** — GPT-4/Claude-powered responses with streaming (typing animation)
- **Real-Time Web Search** — Integrates with SerpAPI / Bing for live web results
- **RAG Pipeline** — Retrieval-Augmented Generation combining LLM + search results
- **Source Citations** — Clickable sources with title, link, and snippet (like Perplexity)
- **Conversational Memory** — Context-aware follow-up questions with full chat history
- **Multiple Search Modes** — Focus, Research, and Quick mode
- **File Upload (RAG)** — Upload PDF/DOCX and ask questions from your documents
- **JWT Authentication** — Signup/Login with secure token-based auth
- **User Dashboard** — View past searches, bookmark answers
- **Dark/Light Mode** — Elegant, modern UI with theme toggle
- **Voice Search** — Speech-to-text input + text-to-speech output
- **Streaming Responses** — Real-time SSE streaming like ChatGPT
- **Rate Limiting & Caching** — Redis-backed caching + request throttling
- **Pro Mode** — Chain-of-thought multi-step reasoning for complex queries

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Cache | Redis |
| AI | OpenAI GPT-4 (swappable) |
| Search | SerpAPI |
| Vector DB | Pinecone (for file RAG) |
| Auth | JWT + bcrypt |
| File Processing | pdf-parse, mammoth |
| Deployment | Vercel (frontend) + Railway (backend) |

## 📂 Folder Structure

```
nexus-search/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React Context (Auth, Theme)
│   │   ├── services/          # API call helpers
│   │   └── utils/             # Utility functions
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── routes/                # Express route definitions
│   ├── controllers/           # Business logic handlers
│   ├── models/                # Mongoose schemas
│   ├── services/              # AI, Search, Vector DB services
│   ├── middleware/            # Auth, rate limiter, error handler
│   ├── utils/                 # Helper functions
│   └── package.json
│
├── .env.example               # Environment variable template
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/nexus-search.git
cd nexus-search

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in the `/server` directory and fill in your keys:

```bash
cp .env.example server/.env
```

### 3. Start Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm start
```

App runs at `http://localhost:3000`, API at `http://localhost:5000`.

## 🔑 Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (GPT-4) |
| `SERPAPI_KEY` | SerpAPI key for web search |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret for signing JWTs |
| `PINECONE_API_KEY` | Pinecone for vector storage |
| `PINECONE_INDEX` | Pinecone index name |

## 🌐 Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Connect to Vercel via GitHub or Vercel CLI
```

Set `REACT_APP_API_URL` to your backend URL in Vercel environment variables.

### Backend → Railway / Render

1. Push `/server` to GitHub
2. Create new Railway project from repo
3. Set all environment variables in Railway dashboard
4. Railway auto-detects Node.js and deploys

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Main AI search (streaming) |
| GET | `/api/search/history` | Get user's search history |
| DELETE | `/api/search/:id` | Delete a search |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List all conversations |
| GET | `/api/conversations/:id` | Get single conversation |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookmarks` | Add bookmark |
| GET | `/api/bookmarks` | List bookmarks |
| DELETE | `/api/bookmarks/:id` | Remove bookmark |

### Files (RAG)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload & embed file |
| POST | `/api/files/query` | Query uploaded file |
| GET | `/api/files` | List user files |
| DELETE | `/api/files/:id` | Delete file |

## 🧠 RAG Pipeline

```
User Query
    │
    ▼
┌─────────────────┐
│  Web Search API  │  ← SerpAPI fetches top 5 results
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Chunker  │  ← Split search result text into chunks
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  Embeddings    │  ← OpenAI text-embedding-ada-002
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │  Vector Search │  ← Find most relevant chunks
    └────┬──────────┘
         │
    ┌────▼────────────────┐
    │  LLM (GPT-4)         │  ← Generate answer from context
    │  + System Prompt     │
    └─────────────────────┘
         │
    Streaming response → Client
```

## 🎯 Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Focus** | Pure AI answer, no sources shown | Quick facts |
| **Research** | Full RAG + sources + detailed answer | Deep dives |
| **Quick** | Fast response, limited context | Speed priority |
| **Pro** | Chain-of-thought multi-step reasoning | Complex queries |

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT expiry: 7 days (configurable)
- Rate limiting: 100 req/15min per IP, 20 searches/hour per user
- Input sanitization on all endpoints
- CORS configured for production origins
- File upload: max 10MB, allowed types only

## 📄 License

MIT License — free for personal and commercial use.

---

Built with ❤️ as a resume-worthy full-stack AI project.
