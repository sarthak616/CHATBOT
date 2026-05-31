import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const EXAMPLE_QUERIES = [
  'What are the latest breakthroughs in quantum computing?',
  'How does the transformer architecture work in AI?',
  'Best practices for React performance optimization',
  'What caused the 2008 financial crisis?',
  'How to build a RAG pipeline with LangChain?',
];

const FEATURES = [
  { icon: Globe, title: 'Real-time Web Search', desc: 'Always current, sourced from the live web' },
  { icon: Sparkles, title: 'AI-Powered Synthesis', desc: 'GPT-4 combines sources into clear answers' },
  { icon: Zap, title: 'Streaming Responses', desc: 'See answers form in real-time as you wait' },
  { icon: Shield, title: 'Cited Sources', desc: 'Every claim backed by a clickable source' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSearch = ({ query, mode }) => {
    navigate(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(77,123,255,0.1)', color: '#4d7bff', border: '1px solid rgba(77,123,255,0.2)' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Powered by GPT-4 + Real-time Web Search
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-4 max-w-3xl"
          style={{ color: 'var(--nexus-text)' }}
        >
          Search the web.{' '}
          <span className="gradient-text">Understand everything.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: 'var(--nexus-muted)' }}
        >
          Ask questions in natural language. Get AI-synthesized answers with
          real sources, streaming responses, and conversational follow-ups.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </motion.div>

        {/* Example queries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-2 justify-center mt-6 max-w-2xl"
        >
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSearch({ query: q, mode: 'research' })}
              className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-nexus-500/50 hover:text-nexus-400 truncate max-w-xs"
              style={{
                background: 'var(--nexus-surface)',
                borderColor: 'var(--nexus-border)',
                color: 'var(--nexus-muted)',
              }}
            >
              {q}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-12 max-w-4xl mx-auto w-full"
      >
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="p-4 rounded-2xl border text-center"
            style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
          >
            <div className="w-9 h-9 rounded-xl bg-nexus-500/10 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-4.5 h-4.5 text-nexus-400 w-[18px] h-[18px]" />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--nexus-text)' }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--nexus-muted)' }}>{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <div className="text-center pb-8">
        <a
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-nexus-500 hover:bg-nexus-600 transition-all shadow-lg shadow-nexus-500/25"
        >
          Get started free
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
