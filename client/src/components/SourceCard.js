import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe } from 'lucide-react';

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

export default function SourceCard({ source, index, compact = false }) {
  if (!source?.url) return null;

  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-card inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all hover:text-nexus-400"
        style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-muted)' }}
        title={source.title}
      >
        {source.favicon ? (
          <img src={source.favicon} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="max-w-[120px] truncate">{getDomain(source.url)}</span>
        <span className="text-nexus-400 font-semibold">{index + 1}</span>
      </a>
    );
  }

  return (
    <motion.a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="source-card flex flex-col gap-2 p-3 rounded-xl border no-underline group"
      style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(77,123,255,0.1)' }}>
          {source.favicon ? (
            <img src={source.favicon} alt="" className="w-3.5 h-3.5 rounded-sm"
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <Globe className="w-3 h-3 text-nexus-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate group-hover:text-nexus-400 transition-colors leading-tight"
            style={{ color: 'var(--nexus-text)' }}>
            {source.title || getDomain(source.url)}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--nexus-muted)' }}>
            {getDomain(source.url)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-nexus-500/15 text-nexus-400">
            {index + 1}
          </span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity"
            style={{ color: 'var(--nexus-muted)' }} />
        </div>
      </div>

      {/* Snippet */}
      {source.snippet && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--nexus-muted)' }}>
          {source.snippet}
        </p>
      )}
    </motion.a>
  );
}

export function SourceGrid({ sources }) {
  if (!sources?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nexus-muted)' }}>
        Sources ({sources.length})
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((source, i) => (
          <SourceCard key={i} source={source} index={i} />
        ))}
      </div>
    </div>
  );
}
