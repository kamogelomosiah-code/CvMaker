import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_RESUME_CONTENT, DEFAULT_CUSTOMIZATION, TEMPLATES } from '../constants';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CreateResumeModal } from '../components/CreateResumeModal';
import { ResumeContent } from '../types';

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) signIn();
  }, [user, signIn]);

  const createResume = async (content: ResumeContent) => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'resumes'), {
        userId: user.uid,
        title: "Untitled Resume",
        templateId: TEMPLATES[0].id,
        content,
        customization: DEFAULT_CUSTOMIZATION,
        lastEdited: serverTimestamp(),
      });
      navigate(`/builder/${docRef.id}`);
    } catch (error) {
      console.error("Error creating resume:", error);
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-[#0A0A0A]" />;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <CreateResumeModal
        isOpen={true}
        onClose={() => navigate('/dashboard')}
        onManual={() => createResume(INITIAL_RESUME_CONTENT)}
        onImportComplete={(content) => createResume(content)}
      />
    </div>
  );
};
