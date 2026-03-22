import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Resume, ResumeContent } from '../types';
import { TEMPLATES } from '../constants';
import { ResumePreview } from '../components/ResumePreview';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Layout as LayoutIcon, 
  User as UserIcon, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

export const Builder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'projects'>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<ResumeContent[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = (newContent: ResumeContent) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newContent)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  const improveBullet = async (expId: string, index: number, currentText: string) => {
    if (!currentText.trim()) return;
    setAiLoading(`${expId}-${index}`);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rewrite this resume bullet point to be more professional, action-oriented, and impactful. Use strong action verbs and quantify results if possible. Keep it concise.
        
        Original: ${currentText}
        
        Rewritten bullet point:`,
      });
      
      const improvedText = response.text?.trim().replace(/^[-•]\s*/, '') || currentText;
      updateExperienceBullet(expId, index, improvedText);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(null);
    }
  };

  const updateExperienceBullet = (expId: string, index: number, value: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: prev.experience.map(exp => {
          if (exp.id === expId) {
            const newDesc = [...exp.description];
            newDesc[index] = value;
            return { ...exp, description: newDesc };
          }
          return exp;
        })
      };
      pushToHistory(next);
      return next;
    });
  };

  const addExperienceBullet = (expId: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: prev.experience.map(exp => {
          if (exp.id === expId) {
            return { ...exp, description: [...exp.description, ""] };
          }
          return exp;
        })
      };
      pushToHistory(next);
      return next;
    });
  };

  const removeExperienceBullet = (expId: string, index: number) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: prev.experience.map(exp => {
          if (exp.id === expId) {
            return { ...exp, description: exp.description.filter((_, i) => i !== index) };
          }
          return exp;
        })
      };
      pushToHistory(next);
      return next;
    });
  };

  const generateSummary = async () => {
    if (!content) return;
    setAiLoading('summary');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a professional resume summary (2-3 sentences) for a person with the following details:
        Name: ${content.personalInfo.fullName}
        Experience: ${content.experience.map(e => e.jobTitle + ' at ' + e.company).join(', ')}
        Skills: ${content.skills.join(', ')}
        
        Professional summary:`,
      });
      
      const summary = response.text?.trim() || content.personalInfo.summary;
      updatePersonalInfo('summary', summary);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(null);
    }
  };

  const suggestSkills = async () => {
    if (!content) return;
    setAiLoading('skills');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following resume information, suggest 5-8 relevant professional skills as a comma-separated list. Do not include introductory text.
        
        Job Titles: ${content.experience.map(e => e.jobTitle).join(', ')}
        Current Skills: ${content.skills.join(', ')}
        Summary: ${content.personalInfo.summary}`,
      });
      
      const suggestedSkillsStr = response.text?.trim() || '';
      if (suggestedSkillsStr) {
        const newSkills = suggestedSkillsStr.split(',').map(s => s.trim()).filter(s => s && !content.skills.includes(s));
        if (newSkills.length > 0) {
          setContent(prev => {
            if (!prev) return null;
            const next = {
              ...prev,
              skills: [...prev.skills, ...newSkills]
            };
            pushToHistory(next);
            return next;
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(null);
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const fetchResume = async () => {
      const docRef = doc(db, 'resumes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Resume;
        if (data.userId !== user.uid) {
          navigate('/dashboard');
          return;
        }
        setResume(data);
        setContent(data.content);
        setHistory([JSON.parse(JSON.stringify(data.content))]);
        setHistoryIndex(0);
      } else {
        navigate('/dashboard');
      }
    };

    fetchResume();
  }, [id, user, navigate]);

  const saveResume = useCallback(async () => {
    if (!id || !content) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'resumes', id), {
        content,
        lastEdited: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving resume:", error);
    } finally {
      setSaving(false);
    }
  }, [id, content]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) saveResume();
    }, 5000);
    return () => clearTimeout(timer);
  }, [content, saveResume]);

  if (!resume || !content) return null;

  const template = TEMPLATES.find(t => t.id === resume.templateId) || TEMPLATES[0];

  const updatePersonalInfo = (field: keyof ResumeContent['personalInfo'], value: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value }
      };
      pushToHistory(next);
      return next;
    });
  };

  const addExperience = () => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: [...prev.experience, {
          id: Math.random().toString(36).substr(2, 9),
          jobTitle: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: [""]
        }]
      };
      pushToHistory(next);
      return next;
    });
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
      };
      pushToHistory(next);
      return next;
    });
  };

  const removeExperience = (id: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        experience: prev.experience.filter(exp => exp.id !== id)
      };
      pushToHistory(next);
      return next;
    });
  };

  const addEducation = () => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        education: [...prev.education, {
          id: Math.random().toString(36).substr(2, 9),
          school: "",
          degree: "",
          location: "",
          startDate: "",
          endDate: "",
          description: []
        }]
      };
      pushToHistory(next);
      return next;
    });
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
      };
      pushToHistory(next);
      return next;
    });
  };

  const removeEducation = (id: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        education: prev.education.filter(edu => edu.id !== id)
      };
      pushToHistory(next);
      return next;
    });
  };

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        skills: [...prev.skills, skill.trim()]
      };
      pushToHistory(next);
      return next;
    });
  };

  const removeSkill = (index: number) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      };
      pushToHistory(next);
      return next;
    });
  };

  const addProject = () => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        projects: [...prev.projects, {
          id: Math.random().toString(36).substr(2, 9),
          name: "",
          description: "",
          link: ""
        }]
      };
      pushToHistory(next);
      return next;
    });
  };

  const updateProject = (id: string, field: string, value: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
      };
      pushToHistory(next);
      return next;
    });
  };

  const removeProject = (id: string) => {
    setContent(prev => {
      if (!prev) return null;
      const next = {
        ...prev,
        projects: prev.projects.filter(proj => proj.id !== id)
      };
      pushToHistory(next);
      return next;
    });
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: UserIcon },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Wrench },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
  ] as const;

  const calculateProgress = () => {
    if (!content) return 0;
    let score = 0;
    if (content.personalInfo.fullName) score += 20;
    if (content.personalInfo.email) score += 10;
    if (content.personalInfo.summary) score += 20;
    if (content.experience.length > 0) score += 20;
    if (content.education.length > 0) score += 15;
    if (content.skills.length > 0) score += 15;
    return score;
  };

  const progress = calculateProgress();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-white transition-all duration-500"
        />
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Editor */}
        <div className={cn(
          "flex-grow md:flex-grow-0 md:w-[500px] bg-[#0A0A0A] border-r border-white/5 flex flex-col transition-all",
          showPreview ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-white truncate max-w-[200px]">{resume.title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1">
                <button 
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </button>
                <button 
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {saving ? "Saving..." : "Saved"}
                </span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="md:hidden p-2 bg-white text-black rounded-lg"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center py-3 px-2 min-w-[80px] transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-white text-white bg-white/5" 
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/2"
              )}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-white">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={content.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl focus:ring-2 focus:ring-white/20 text-white outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={content.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl focus:ring-2 focus:ring-white/20 text-white outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                      <input
                        type="text"
                        value={content.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl focus:ring-2 focus:ring-white/20 text-white outline-none transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      value={content.personalInfo.location}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl focus:ring-2 focus:ring-white/20 text-white outline-none transition-all"
                      placeholder="New York, NY"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Professional Summary</label>
                      <button
                        onClick={generateSummary}
                        disabled={aiLoading === 'summary'}
                        className="flex items-center gap-1 text-[10px] font-bold text-white hover:text-gray-300 disabled:opacity-50"
                      >
                        {aiLoading === 'summary' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Write for me
                      </button>
                    </div>
                    <textarea
                      value={content.personalInfo.summary}
                      onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl focus:ring-2 focus:ring-white/20 text-white outline-none transition-all resize-none"
                      placeholder="Short summary of who you are and your top skills (2-3 sentences)"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'experience' && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Work Experience</h3>
                  <button
                    onClick={addExperience}
                    className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8">
                  {content.experience.map((exp) => (
                    <div key={exp.id} className="p-6 bg-white/2 rounded-2xl border border-white/5 relative group">
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Job Title</label>
                            <input
                              type="text"
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                              placeholder="Jan 2020"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                              placeholder="Present"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Achievements</label>
                            <button
                              onClick={() => addExperienceBullet(exp.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-white hover:text-gray-300"
                            >
                              <Plus className="w-3 h-3" /> Add achievement
                            </button>
                          </div>
                          <div className="space-y-3">
                            {exp.description.map((bullet, index) => (
                              <div key={index} className="flex gap-2 group/bullet">
                                <div className="flex-grow relative">
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => updateExperienceBullet(exp.id, index, e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20 pr-8"
                                    placeholder="e.g. Led a team of 3 to develop a student portal"
                                  />
                                  <button
                                    onClick={() => improveBullet(exp.id, index, bullet)}
                                    disabled={aiLoading === `${exp.id}-${index}`}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white disabled:opacity-50"
                                    title="AI Improve"
                                  >
                                    {aiLoading === `${exp.id}-${index}` ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeExperienceBullet(exp.id, index)}
                                  className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/bullet:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'education' && (
              <motion.div
                key="education"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Education</h3>
                  <button
                    onClick={addEducation}
                    className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8">
                  {content.education.map((edu) => (
                    <div key={edu.id} className="p-6 bg-white/2 rounded-2xl border border-white/5 relative group">
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">School</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                            <input
                              type="text"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                              placeholder="Jan 2020"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={edu.endDate}
                                disabled={edu.endDate === 'Present'}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                                placeholder="Dec 2024"
                              />
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={edu.endDate === 'Present'}
                                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.checked ? 'Present' : '')}
                                  className="rounded border-white/10 bg-white/5 text-white focus:ring-white/20"
                                />
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Currently studying here</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Skills</h3>
                  <button
                    onClick={suggestSkills}
                    disabled={aiLoading === 'skills'}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50 text-sm font-bold"
                  >
                    {aiLoading === 'skills' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI Suggest Skills
                  </button>
                </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="skill-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addSkill((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-grow px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Type a skill and press Enter"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('skill-input') as HTMLInputElement;
                          addSkill(input.value);
                          input.value = '';
                        }}
                        className="px-6 bg-white text-black rounded-xl font-bold"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Skill Suggestions */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git', 'Agile', 'UI/UX'].filter(s => !content.skills.includes(s)).slice(0, 5).map(skill => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="px-3 py-1 bg-white/2 border border-white/5 rounded-full text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                    {content.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-sm font-medium text-white hover:border-red-500/50 hover:text-red-500 transition-all cursor-default"
                      >
                        {skill}
                        <button onClick={() => removeSkill(i)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Projects</h3>
                  <button
                    onClick={addProject}
                    className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8">
                  {content.projects.map((proj) => (
                    <div key={proj.id} className="p-6 bg-white/2 rounded-2xl border border-white/5 relative group">
                      <button
                        onClick={() => removeProject(proj.id)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Link (Optional)</label>
                          <input
                            type="text"
                            value={proj.link}
                            onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20"
                            placeholder="https://github.com/..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                          <textarea
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-white outline-none focus:ring-2 focus:ring-white/20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Pane */}
        <div className={cn(
          "flex-grow bg-[#111] overflow-y-auto p-8 md:p-12 transition-all",
          showPreview ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}>
          <div className="max-w-[800px] mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowPreview(false)}
                className="md:hidden flex items-center gap-2 text-white font-bold"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Editor
              </button>
              <div className="hidden md:block" />
              <button
                onClick={() => navigate(`/preview/${id}`)}
                className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-all"
              >
                <Eye className="w-4 h-4" /> Preview & Download
              </button>
            </div>
            <ResumePreview content={content} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
};
