import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, BookMarked, Moon, Sun, LogOut,
  ChevronLeft, ChevronRight, Menu, X, User, Sparkles, Image, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

 const navItems = [
  { path: '/', icon: Home, label: 'Home', exact: true },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/image', icon: Image, label: 'Image AI' },
  { path: '/pdf', icon: FileText, label: 'PDF AI' },
  ...(user ? [{ path: '/dashboard', icon: BookMarked, label: 'Dashboard' }] : []),
];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--nexus-bg)', color: 'var(--nexus-text)' }}>
      {/* Sidebar — Desktop */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 border-r ${sidebarOpen ? 'w-56' : 'w-16'}`}
        style={{ borderColor: 'var(--nexus-border)', background: 'var(--nexus-surface)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16 border-b" style={{ borderColor: 'var(--nexus-border)' }}>
          <div className="w-8 h-8 rounded-lg bg-nexus-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display font-700 text-lg tracking-tight"
              >
                Nexus
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = path === '/' ? location.pathname === '/' : isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                  ${active
                    ? 'bg-nexus-500/20 text-nexus-400'
                    : 'hover:bg-white/5'
                  }`}
                style={{ color: active ? undefined : 'var(--nexus-muted)' }}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t space-y-1" style={{ borderColor: 'var(--nexus-border)' }}>
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            style={{ color: 'var(--nexus-muted)' }}>
            {isDark ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
            {sidebarOpen && <span className="text-sm font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {user ? (
            <>
              <div className={`flex items-center gap-2.5 px-3 py-2 ${sidebarOpen ? '' : 'justify-center'}`}>
                <div className="w-7 h-7 rounded-full bg-nexus-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-nexus-400">
                    {user.name[0].toUpperCase()}
                  </span>
                </div>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--nexus-text)' }}>{user.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--nexus-muted)' }}>{user.plan}</p>
                  </div>
                )}
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
                style={{ color: 'var(--nexus-muted)' }}>
                <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarOpen && <span>Sign out</span>}
              </button>
            </>
          ) : (
            sidebarOpen && (
              <Link to="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all text-sm"
                style={{ color: 'var(--nexus-muted)' }}>
                <User className="w-[18px] h-[18px]" />
                <span>Sign in</span>
              </Link>
            )
          )}

          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-all"
            style={{ color: 'var(--nexus-muted)' }}>
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: 'var(--nexus-surface)', borderColor: 'var(--nexus-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-nexus-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-base">Nexus</span>
        </div>
        <button onClick={() => setMobileMenuOpen(o => !o)} style={{ color: 'var(--nexus-muted)' }}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 pt-14"
            style={{ background: 'var(--nexus-surface)' }}
          >
            <nav className="p-4 space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link key={path} to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all"
                  style={{ color: 'var(--nexus-text)' }}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              <button onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all"
                style={{ color: 'var(--nexus-text)' }}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span>
              </button>
              {user ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign out</span>
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-nexus-500/20 text-nexus-400 transition-all">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Sign in</span>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
