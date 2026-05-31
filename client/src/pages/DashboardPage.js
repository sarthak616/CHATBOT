import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  BookMarked, Clock, Search, Trash2, BookOpen, Zap, Brain, Layers,
  BarChart2, ArrowRight, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MODE_ICONS = { research: BookOpen, focus: Brain, quick: Zap, pro: Layers };
const MODE_COLORS = {
  research: 'text-blue-400 bg-blue-400/10',
  focus: 'text-purple-400 bg-purple-400/10',
  quick: 'text-yellow-400 bg-yellow-400/10',
  pro: 'text-nexus-400 bg-nexus-400/10',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadData();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'history') {
        const { data } = await api.get('/search/history');
        setHistory(data.conversations);
        setPagination(data.pagination);
      } else {
        const { data } = await api.get('/bookmarks');
        setBookmarks(data.bookmarks);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      setHistory(prev => prev.filter(c => c._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const deleteBookmark = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b._id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--nexus-text)' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--nexus-muted)' }}>
          Welcome back, {user?.name} · {user?.searchCount || 0} total searches
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Searches', value: user?.searchCount || 0, icon: Search },
          { label: 'Conversations', value: pagination?.total || history.length, icon: Clock },
          { label: 'Bookmarks', value: bookmarks.length, icon: BookMarked },
          { label: 'Plan', value: user?.plan?.toUpperCase() || 'FREE', icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="p-4 rounded-xl border"
            style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
          >
            <Icon className="w-4 h-4 mb-2 text-nexus-400" />
            <p className="text-xl font-display font-bold" style={{ color: 'var(--nexus-text)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}>
        {[
          { id: 'history', label: 'History', icon: Clock },
          { id: 'bookmarks', label: 'Bookmarks', icon: BookMarked },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-nexus-500/20 text-nexus-400' : 'hover:bg-white/5'}`}
            style={{ color: tab === id ? undefined : 'var(--nexus-muted)' }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : tab === 'history' ? (
        <HistoryList items={history} onDelete={deleteConversation} />
      ) : (
        <BookmarkList items={bookmarks} onDelete={deleteBookmark} />
      )}
    </div>
  );
}

function HistoryList({ items, onDelete }) {
  const navigate = useNavigate();
  if (!items.length) {
    return <EmptyState icon={Clock} title="No search history yet" desc="Start searching to build your history" action={{ label: 'Start searching', href: '/search' }} />;
  }

  return (
    <div className="space-y-2">
      {items.map((conv, i) => {
        const ModeIcon = MODE_ICONS[conv.mode] || BookOpen;
        return (
          <motion.div
            key={conv._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:border-nexus-500/30"
            style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
            onClick={() => navigate(`/search/${conv._id}`)}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${MODE_COLORS[conv.mode]}`}>
              <ModeIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--nexus-text)' }}>
                {conv.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--nexus-muted)' }}>
                {conv.messageCount} messages · {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all"
                style={{ color: 'var(--nexus-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--nexus-muted)' }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function BookmarkList({ items, onDelete }) {
  if (!items.length) {
    return <EmptyState icon={BookMarked} title="No bookmarks yet" desc="Save answers you want to revisit" action={{ label: 'Start searching', href: '/search' }} />;
  }

  return (
    <div className="space-y-3">
      {items.map((bm, i) => (
        <motion.div
          key={bm._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="group p-4 rounded-xl border"
          style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--nexus-text)' }}>
              {bm.query}
            </h3>
            <button
              onClick={() => onDelete(bm._id)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0"
              style={{ color: 'var(--nexus-muted)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs leading-relaxed line-clamp-3 mb-2" style={{ color: 'var(--nexus-muted)' }}>
            {bm.answer.substring(0, 300)}
          </p>
          <p className="text-xs" style={{ color: 'var(--nexus-muted)', opacity: 0.6 }}>
            {formatDistanceToNow(new Date(bm.createdAt), { addSuffix: true })}
            {bm.sources?.length > 0 && ` · ${bm.sources.length} sources`}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 rounded-2xl bg-nexus-500/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-nexus-400" />
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: 'var(--nexus-text)' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'var(--nexus-muted)' }}>{desc}</p>
      {action && (
        <Link to={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-nexus-400 bg-nexus-500/10 hover:bg-nexus-500/20 transition-all">
          {action.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
