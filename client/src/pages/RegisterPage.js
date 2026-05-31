import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'Contains a letter', test: p => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number', test: p => /\d/.test(p) },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-nexus-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--nexus-text)' }}>
            Create account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--nexus-muted)' }}>
            Start searching smarter with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--nexus-muted)' }}>Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--nexus-muted)' }} />
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-nexus-500 transition-colors"
                style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
                required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--nexus-muted)' }}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--nexus-muted)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-nexus-500 transition-colors"
                style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
                required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--nexus-muted)' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--nexus-muted)' }} />
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm outline-none focus:border-nexus-500 transition-colors"
                style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)', color: 'var(--nexus-text)' }}
                required />
              <button type="button" onClick={() => setShowPassword(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--nexus-muted)' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="space-y-1 pt-1">
                {PASSWORD_RULES.map(rule => (
                  <div key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${rule.test(password) ? 'text-green-400' : ''}`}
                    style={{ color: rule.test(password) ? undefined : 'var(--nexus-muted)' }}>
                    <Check className={`w-3 h-3 ${rule.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-nexus-500 hover:bg-nexus-600 transition-all disabled:opacity-50 shadow-lg shadow-nexus-500/20">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--nexus-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-nexus-400 hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
