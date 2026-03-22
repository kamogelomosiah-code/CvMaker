import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowRight, CheckCircle2, FileText, Layout as LayoutIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing: React.FC = () => {
  const { signIn, user } = useAuth();

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-12 border border-white/10 backdrop-blur-sm"
            >
              <Zap className="w-3 h-3 text-white" />
              The Future of Resume Building
            </motion.div>
            
            <div className="relative mb-16">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-[12vw] md:text-[10vw] font-bold text-white tracking-tighter leading-[0.85] uppercase"
              >
                Craft Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">Legacy</span>
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-4 -right-4 md:top-0 md:right-0 w-24 h-24 md:w-32 md:h-32 border border-white/10 rounded-full flex items-center justify-center rotate-12 backdrop-blur-sm"
              >
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center leading-tight">
                  AI <br /> Powered
                </span>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-gray-500 mb-16 leading-relaxed max-w-2xl mx-auto font-medium"
            >
              Stop retyping. Start building. Use AI to extract your history and craft a professional narrative in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              {user ? (
                <Link
                  to="/dashboard"
                  className="group w-full sm:w-auto bg-white text-black px-10 py-5 rounded-full font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="group w-full sm:w-auto bg-white text-black px-10 py-5 rounded-full font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  Get Started for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <Link
                to="/templates"
                className="w-full sm:w-auto bg-transparent text-white border border-white/10 px-10 py-5 rounded-full font-bold text-sm hover:bg-white/5 transition-all backdrop-blur-sm"
              >
                Browse Templates
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Immersive Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0A0A0A_70%)]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/5">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6">
                <LayoutIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Intuitive Builder</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Simple, multi-step interface that guides you through every section of your resume.
              </p>
            </div>
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/5">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">ATS-Friendly</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Templates optimized for Applicant Tracking Systems to ensure your resume gets seen.
              </p>
            </div>
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/5">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Instant Export</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Download your resume as a high-quality PDF or share it via a unique link.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
