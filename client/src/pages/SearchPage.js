import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Paperclip, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import AnswerBlock from '../components/AnswerBlock';
import { SourceGrid } from '../components/SourceCard';
import SourceCard from '../components/SourceCard';
import FileUpload from '../components/FileUpload';
import { streamSearch } from '../services/searchService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { conversationId: urlConvId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(urlConvId || null);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFileName, setActiveFileName] = useState(null);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  // Load conversation from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    const mode = searchParams.get('mode') || 'research';

    if (q && messages.length === 0) {
      handleSearch({ query: q, mode });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing conversation
  useEffect(() => {
    if (urlConvId && messages.length === 0) {
      loadConversation(urlConvId);
    }
  }, [urlConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversation = async (id) => {
    try {
      const { data } = await api.get(`/conversations/${id}`);
      const conv = data.conversation;
      const loadedMessages = [];

      // Pair up user+assistant messages
      for (let i = 0; i < conv.messages.length; i++) {
        const msg = conv.messages[i];
        if (msg.role === 'user') {
          const assistantMsg = conv.messages[i + 1];
          loadedMessages.push({
            id: msg._id,
            query: msg.content,
            answer: assistantMsg?.content || '',
            sources: assistantMsg?.sources || [],
            mode: msg.mode,
            isStreaming: false,
          });
          i++;
        }
      }
      setMessages(loadedMessages);
      setCurrentConvId(id);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const handleSearch = useCallback(({ query, mode }) => {
    if (isLoading) {
      abortRef.current?.();
      return;
    }

    const msgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: msgId,
      query,
      answer: '',
      sources: [],
      mode,
      isStreaming: true,
    }]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const abort = streamSearch({
      query,
      mode,
      conversationId: currentConvId,
      fileId: activeFileId,

      onSources: (sources) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, sources } : m
        ));
      },

      onChunk: (chunk) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, answer: m.answer + chunk } : m
        ));
      },

      onDone: ({ conversationId, latencyMs }) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, isStreaming: false } : m
        ));
        setIsLoading(false);
        abortRef.current = null;

        if (conversationId && conversationId !== currentConvId) {
          setCurrentConvId(conversationId);
          navigate(`/search/${conversationId}`, { replace: true });
        }

        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },

      onError: (err) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, answer: `Error: ${err}`, isStreaming: false } : m
        ));
        setIsLoading(false);
        toast.error(err || 'Search failed');
      },
    });

    abortRef.current = abort;
  }, [isLoading, currentConvId, activeFileId, navigate]);

  const handleNewSearch = () => {
    abortRef.current?.();
    setMessages([]);
    setCurrentConvId(null);
    setIsLoading(false);
    navigate('/search', { replace: true });
  };

  const handleBookmark = async (msg) => {
    if (!user) {
      toast.error('Sign in to save bookmarks');
      return;
    }
    try {
      await api.post('/bookmarks', {
        query: msg.query,
        answer: msg.answer,
        sources: msg.sources,
        conversationId: currentConvId,
      });
      toast.success('Bookmarked!');
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const handleFileReady = ({ fileId, fileName }) => {
    setActiveFileId(fileId);
    setActiveFileName(fileName);
    setShowFilePanel(false);
    toast.success(`Now querying: ${fileName}`);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* File context banner */}
      <AnimatePresence>
        {activeFileId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between px-6 py-2 text-xs border-b"
            style={{ background: 'rgba(77,123,255,0.08)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-muted)' }}
          >
            <span>
              📄 File context: <span className="text-nexus-400 font-medium">{activeFileName}</span> — answers will reference this document
            </span>
            <button onClick={() => { setActiveFileId(null); setActiveFileName(null); }}
              className="hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 pt-6 pb-48">

        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-nexus-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-nexus-400" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--nexus-text)' }}>
              Ask anything
            </h2>
            <p className="text-sm" style={{ color: 'var(--nexus-muted)' }}>
              Search the web with AI-powered answers and cited sources
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="space-y-8">
          {messages.map((msg, i) => (
            <MessageBlock
              key={msg.id}
              msg={msg}
              isFirst={i === 0}
              onBookmark={() => handleBookmark(msg)}
              hasUser={!!user}
            />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Fixed bottom search bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-16 z-30"
        style={{ background: 'linear-gradient(to top, var(--nexus-bg) 70%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
          {/* File panel */}
          <AnimatePresence>
            {showFilePanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-4 rounded-xl border"
                style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
              >
                <FileUpload onFileReady={handleFileReady} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                compact
              />
            </div>
            {/* File upload toggle */}
            <button
              onClick={() => setShowFilePanel(o => !o)}
              className="p-3 rounded-xl border transition-all hover:bg-white/5 flex-shrink-0"
              style={{
                background: showFilePanel ? 'rgba(77,123,255,0.1)' : 'var(--nexus-surface)',
                borderColor: showFilePanel ? 'rgba(77,123,255,0.3)' : 'var(--nexus-border)',
                color: showFilePanel ? '#4d7bff' : 'var(--nexus-muted)',
              }}
              title="Upload document for RAG"
            >
              <Paperclip className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </button>
            {/* New conversation */}
            {messages.length > 0 && (
              <button
                onClick={handleNewSearch}
                className="p-3 rounded-xl border transition-all hover:bg-white/5 flex-shrink-0"
                style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-muted)' }}
                title="New search"
              >
                <Plus className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBlock({ msg, isFirst, onBookmark, hasUser }) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const hasSources = msg.sources?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* User query */}
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #4d7bff, #a855f7)' }}>
          {hasUser ? 'U' : '?'}
        </div>
        <h2 className="text-base font-semibold leading-relaxed flex-1 pt-0.5"
          style={{ color: 'var(--nexus-text)' }}>
          {msg.query}
        </h2>
      </div>

      {/* Sources (collapsible) */}
      {hasSources && (
        <div className="space-y-2">
          <button
            onClick={() => setSourcesExpanded(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all hover:text-nexus-400"
            style={{ color: 'var(--nexus-muted)' }}
          >
            {sourcesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{msg.sources.length} Sources</span>
          </button>

          <AnimatePresence>
            {sourcesExpanded ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <SourceGrid sources={msg.sources} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-1.5"
              >
                {msg.sources.slice(0, 4).map((s, i) => (
                  <SourceCard key={i} source={s} index={i} compact />
                ))}
                {msg.sources.length > 4 && (
                  <button
                    onClick={() => setSourcesExpanded(true)}
                    className="px-2 py-1 rounded-lg text-xs border transition-all hover:border-nexus-500/50"
                    style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-muted)' }}
                  >
                    +{msg.sources.length - 4} more
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AI Answer */}
      <div className="pl-4 border-l-2" style={{ borderColor: 'rgba(77,123,255,0.3)' }}>
        <AnswerBlock
          answer={msg.answer}
          isStreaming={msg.isStreaming}
          onBookmark={hasUser ? onBookmark : null}
        />
      </div>
    </motion.div>
  );
}
