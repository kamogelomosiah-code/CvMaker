import React, { useState } from 'react';
import { TEMPLATES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_RESUME_CONTENT, DEFAULT_CUSTOMIZATION } from '../constants';
import { CheckCircle2, Layout as LayoutIcon, Star, Plus, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

export const Templates: React.FC = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

  const filteredTemplates = activeFilter === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeFilter);

  const handleUseTemplate = async (templateId: string) => {
    if (!user) {
      signIn();
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'resumes'), {
        userId: user.uid,
        title: "New Resume",
        templateId,
        content: INITIAL_RESUME_CONTENT,
        customization: DEFAULT_CUSTOMIZATION,
        lastEdited: serverTimestamp(),
      });
      navigate(`/builder/${docRef.id}`);
    } catch (error) {
      console.error("Error creating resume from template:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#0A0A0A]">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Choose Your Template</h1>
        <p className="text-gray-500 text-sm">
          Select from our collection of professional, ATS-friendly templates.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeFilter === category 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* Blank Canvas Option */}
        <motion.div
          whileHover={{ y: -8 }}
          onClick={() => handleUseTemplate(TEMPLATES[0].id)}
          className="group bg-white/5 rounded-[32px] border border-white/5 overflow-hidden transition-all cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Start with a blank canvas</h3>
          <p className="text-gray-500 text-sm text-center px-8">
            Start fresh with a simple, clean layout.
          </p>
        </motion.div>

        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -8 }}
            className="group bg-white/5 rounded-[32px] border border-white/5 overflow-hidden transition-all relative"
          >
            <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <Palette className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Customizable</span>
            </div>
            <div className="aspect-[3/4] bg-white/5 relative overflow-hidden">
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Use Template
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{template.name}</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{template.category}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
