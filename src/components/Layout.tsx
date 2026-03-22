import React from 'react';
import { Navbar } from './Navbar';
import { motion } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-grow"
      >
        {children}
      </motion.main>
      <footer className="bg-[#0A0A0A] border-t border-white/5 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-black text-xs font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">ResumeCraft</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs">
                Empowering professionals to build their dream careers with intuitive resume tools.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Templates</li>
                <li>Builder</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>About</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} ResumeCraft. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
