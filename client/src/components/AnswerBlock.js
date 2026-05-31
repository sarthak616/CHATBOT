import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Copy, Check, Volume2, VolumeX, BookmarkPlus, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnswerBlock({ answer, isStreaming, onBookmark }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    });
  }, [answer]);

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [answer, speaking]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: 'Nexus Search Answer', text: answer.substring(0, 200) + '...' });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    }
  }, [answer]);

  if (!answer && !isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Answer content */}
      <div className={`prose-nexus text-sm leading-relaxed ${isStreaming ? 'typing-cursor' : ''}`}
        style={{ color: 'var(--nexus-text)' }}>
        {answer ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {answer}
          </ReactMarkdown>
        ) : (
          <div className="flex items-center gap-2" style={{ color: 'var(--nexus-muted)' }}>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-nexus-400"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </div>
            <span className="text-xs">Thinking...</span>
          </div>
        )}
      </div>

      {/* Action bar — only show after streaming complete */}
      {!isStreaming && answer && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1 pt-2 border-t"
          style={{ borderColor: 'var(--nexus-border)' }}
        >
          <ActionButton onClick={handleCopy} title="Copy answer">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </ActionButton>

          <ActionButton onClick={handleSpeak} title="Read aloud" active={speaking}>
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{speaking ? 'Stop' : 'Listen'}</span>
          </ActionButton>

          {onBookmark && (
            <ActionButton onClick={onBookmark} title="Bookmark this answer">
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save</span>
            </ActionButton>
          )}

          <ActionButton onClick={handleShare} title="Share">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </ActionButton>
        </motion.div>
      )}
    </motion.div>
  );
}

function ActionButton({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
        ${active ? 'text-nexus-400 bg-nexus-500/15' : 'hover:bg-white/8'}`}
      style={{ color: active ? undefined : 'var(--nexus-muted)' }}
    >
      {children}
    </button>
  );
}
