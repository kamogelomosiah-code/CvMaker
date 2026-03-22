import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Resume } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit2, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../lib/utils';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', user.uid),
      orderBy('lastEdited', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
      setResumes(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resumes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const deleteResume = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await deleteDoc(doc(db, 'resumes', id));
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#0A0A0A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Resumes</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and edit your professional resumes.</p>
        </div>
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Create New CV
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No resumes yet</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Start by creating your first professional resume using our expert templates.
          </p>
          <button
            onClick={() => navigate('/templates')}
            className="text-white font-bold text-sm hover:underline"
          >
            Create your first resume &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.map((resume) => (
            <motion.div
              layout
              key={resume.id}
              className="group bg-white/5 rounded-[32px] border border-white/5 overflow-hidden transition-all"
            >
              <div className="aspect-[3/4] bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-white/5" />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                  <Link
                    to={`/builder/${resume.id}`}
                    className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/preview/${resume.id}`}
                    className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-white truncate text-lg">{resume.title}</h3>
                  <button
                    onClick={() => deleteResume(resume.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  <span>Edited {formatDate(resume.lastEdited)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

