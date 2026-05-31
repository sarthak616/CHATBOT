import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, Paperclip, X, ChevronDown, Zap, Brain, BookOpen, Layers } from 'lucide-react';

const MODES = [
  { id: 'research', label: 'Research', icon: BookOpen, desc: 'Detailed with sources' },
  { id: 'focus', label: 'Focus', icon: Brain, desc: 'AI only, no sources' },
  { id: 'quick', label: 'Quick', icon: Zap, desc: 'Fast brief answer' },
  { id: 'pro', label: 'Pro', icon: Layers, desc: 'Chain-of-thought reasoning', premium: true },
];

export default function SearchBar({ onSearch, isLoading, initialQuery = '', initialMode = 'research', compact = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState(initialMode);
  const [modeDropdown, setModeDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [query]);

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  const handleSubmit = useCallback(() => {
    if (!query.trim() || isLoading) return;
    onSearch?.({ query: query.trim(), mode });
  }, [query, mode, isLoading, onSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setQuery(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const currentMode = MODES.find(m => m.id === mode);

  return (
    <div className="w-full">
      <div
        className={`relative rounded-2xl border transition-all duration-200 search-glow ${dragOver ? 'border-nexus-500' : ''}`}
        style={{
          background: 'var(--nexus-surface)',
          borderColor: dragOver ? undefined : 'var(--nexus-border)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        {/* Main input area */}
        <div className="flex items-start gap-3 px-4 pt-4">
          <Search className="w-5 h-5 mt-0.5 flex-shrink-0 text-nexus-400" />
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder:opacity-40"
            style={{ color: 'var(--nexus-text)', minHeight: '28px', maxHeight: '200px' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-white/10 transition-all flex-shrink-0 mt-0.5"
              style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <div className="flex items-center gap-2">
            {/* Mode selector */}
            <div className="relative">
              <button
                onClick={() => setModeDropdown(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
                style={{ color: 'var(--nexus-muted)', background: 'rgba(255,255,255,0.05)' }}
              >
                <currentMode.icon className="w-3.5 h-3.5" />
                <span>{currentMode.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {modeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-2xl overflow-hidden w-52"
                    style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}
                  >
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setModeDropdown(false); }}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all hover:bg-white/5
                          ${mode === m.id ? 'text-nexus-400' : ''}`}
                        style={{ color: mode === m.id ? undefined : 'var(--nexus-text)' }}
                      >
                        <m.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {m.label}
                            {m.premium && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nexus-500/20 text-nexus-400">PRO</span>}
                          </div>
                          <div className="text-xs opacity-50 mt-0.5">{m.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice button */}
            <button
              onClick={toggleVoice}
              className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10'}`}
              style={{ color: isListening ? undefined : 'var(--nexus-muted)' }}
              title="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
              ${query.trim() && !isLoading
                ? 'bg-nexus-500 hover:bg-nexus-600 text-white shadow-lg shadow-nexus-500/25'
                : 'opacity-30 cursor-not-allowed'
              }`}
            style={{ background: query.trim() && !isLoading ? undefined : 'rgba(255,255,255,0.1)', color: query.trim() && !isLoading ? undefined : 'var(--nexus-muted)' }}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Click outside to close mode dropdown */}
      {modeDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setModeDropdown(false)} />
      )}
    </div>
  );
}
