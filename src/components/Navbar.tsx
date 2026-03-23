import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FileText, LogOut, User as UserIcon, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, profile, signIn, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Templates', path: '/templates' },
    { name: 'Dashboard', path: '/dashboard', protected: true },
  ];

  return (
    <nav className="bg-[#0A0A0A] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FileText className="text-black w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ResumeCraft</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              (!link.protected || user) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path ? 'text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            
            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{profile?.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all shadow-sm"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 p-2"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0A] border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {user && (
                <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-white/5">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                  </div>
                </div>
              )}
              {navLinks.map((link) => (
                (!link.protected || user) && (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md"
                  >
                    {link.name}
                  </Link>
                )
              ))}
              {!user ? (
                <button
                  onClick={() => { signIn(); setIsOpen(false); }}
                  className="w-full mt-4 bg-white text-black px-4 py-3 rounded-lg font-semibold"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => { signOut(); setIsOpen(false); }}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-red-500 font-medium py-2"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
