import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, INITIAL_RESUME_CONTENT, DEFAULT_CUSTOMIZATION } from '../constants';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { CreateResumeModal } from '../components/CreateResumeModal';
import { ResumeContent } from '../types';

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    if (!user) {
      signIn();
      return;
    }
    setSelectedTemplateForModal(templateId);
  };

  const createResume = async (content: ResumeContent) => {
    if (!user || !selectedTemplateForModal) return;
    setLoadingId(selectedTemplateForModal);
    setSelectedTemplateForModal(null);
    try {
      const docRef = await addDoc(collection(db, 'resumes'), {
        userId: user.uid,
        title: "Untitled Resume",
        templateId: selectedTemplateForModal,
        content,
        customization: DEFAULT_CUSTOMIZATION,
        lastEdited: serverTimestamp(),
      });
      navigate(`/builder/${docRef.id}`);
    } catch (error) {
      console.error("Error creating resume:", error);
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Choose a Template</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Select our professionally designed template to start building your resume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TEMPLATES.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white/5 rounded-[32px] border border-white/5 overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="aspect-[210/297] bg-white/5 relative overflow-hidden">
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button
                    onClick={() => handleSelectTemplate(template.id)}
                    disabled={loadingId === template.id}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loadingId === template.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : (
                      <>Use Template <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{template.name}</h3>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {template.category}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <CreateResumeModal
        isOpen={!!selectedTemplateForModal}
        onClose={() => setSelectedTemplateForModal(null)}
        onManual={() => createResume(INITIAL_RESUME_CONTENT)}
        onImportComplete={(content) => createResume(content)}
      />
    </div>
  );
};
