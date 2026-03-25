import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Resume, ResumeContent, ResumeCustomization } from '../types';
import { TEMPLATES, DEFAULT_CUSTOMIZATION, COLOR_PALETTES } from '../constants';
import { ResumePreview } from '../components/ResumePreview';
import { AIReviewModal, AISuggestion } from '../components/AIReviewModal';
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
  Loader2,
  Palette,
  X,
  GripVertical,
  Columns,
  EyeOff,
  Edit2
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
  const [customization, setCustomization] = useState<ResumeCustomization>(DEFAULT_CUSTOMIZATION);
  const [showCustomization, setShowCustomization] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'projects'>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<ResumeContent[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const applyAIEdit = (edit: AISuggestion) => {
    setContent(prev => {
      if (!prev) return null;
      const next = { ...prev };
      
      if (edit.type === 'summary') {
        next.personalInfo = { ...next.personalInfo, summary: edit.suggestedText };
      } else if (edit.type === 'experience' && edit.itemId !== undefined && edit.bulletIndex !== undefined) {
        next.experience = next.experience.map(exp => {
          if (exp.id === edit.itemId) {
            const currentDesc = Array.isArray(exp.description) ? exp.description : typeof exp.description === 'string' ? [exp.description] : [];
            const newDesc = [...currentDesc];
            const bIndex = Number(edit.bulletIndex);
            if (!isNaN(bIndex)) {
              newDesc[bIndex] = edit.suggestedText;
            }
            return { ...exp, description: newDesc };
          }
          return exp;
        });
      }
      
      pushToHistory(next);
      return next;
    });
  };

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
            const currentDesc = Array.isArray(exp.description) ? exp.description : typeof exp.description === 'string' ? [exp.description] : [];
            const newDesc = [...currentDesc];
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
            const currentDesc = Array.isArray(exp.description) ? exp.description : typeof exp.description === 'string' ? [exp.description] : [];
            return { ...exp, description: [...currentDesc, ""] };
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
            const currentDesc = Array.isArray(exp.description) ? exp.description : typeof exp.description === 'string' ? [exp.description] : [];
            return { ...exp, description: currentDesc.filter((_, i) => i !== index) };
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

        // Ensure descriptions are arrays for backward compatibility
        if (data.content.experience) {
          data.content.experience = data.content.experience.map(exp => ({
            ...exp,
            description: Array.isArray(exp.description) 
              ? exp.description 
              : typeof exp.description === 'string' 
                ? [exp.description] 
                : ['']
          }));
        }
        
        if (data.content.education) {
          data.content.education = data.content.education.map(edu => ({
            ...edu,
            description: Array.isArray(edu.description) 
              ? edu.description 
              : typeof edu.description === 'string' 
                ? [edu.description] 
                : ['']
          }));
        }

        setResume(data);
        setContent(data.content);
        if (data.customization) {
          setCustomization(data.customization);
        }
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
        customization,
        lastEdited: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving resume:", error);
    } finally {
      setSaving(false);
    }
  }, [id, content, customization]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) saveResume();
    }, 5000);
    return () => clearTimeout(timer);
  }, [content, customization, saveResume]);

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
          <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition-colors text-white"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h2 className="font-bold text-white truncate max-w-[120px] sm:max-w-[200px] text-sm sm:text-base">{resume.title}</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {saving ? "Saving..." : "Saved"}
                </span>
                <button
                  onClick={() => setShowAIReview(true)}
                  className="p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden sm:inline">AI Review</span>
                </button>
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                    showCustomization ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Palette className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden sm:inline">Customize</span>
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="md:hidden p-1.5 sm:p-2 bg-white text-black rounded-lg"
                >
                  {showPreview ? <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>
          </div>

        {showCustomization ? (
          <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0A0A0A]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Customize Appearance</h2>
              <button onClick={() => setShowCustomization(false)} className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Colors */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomization(prev => ({ ...prev, colors: palette }))}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      customization.colors.primary === palette.primary 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    )}
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: palette.background }} />
                    </div>
                    <span className="text-xs font-bold text-white">{palette.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Colors</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Primary</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customization.colors.primary}
                        onChange={(e) => setCustomization(prev => ({ ...prev, colors: { ...prev.colors, primary: e.target.value } }))}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs text-white font-mono">{customization.colors.primary}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customization.colors.secondary}
                        onChange={(e) => setCustomization(prev => ({ ...prev, colors: { ...prev.colors, secondary: e.target.value } }))}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs text-white font-mono">{customization.colors.secondary}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Text</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customization.colors.text}
                        onChange={(e) => setCustomization(prev => ({ ...prev, colors: { ...prev.colors, text: e.target.value } }))}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs text-white font-mono">{customization.colors.text}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customization.colors.background}
                        onChange={(e) => setCustomization(prev => ({ ...prev, colors: { ...prev.colors, background: e.target.value } }))}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs text-white font-mono">{customization.colors.background}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Layout & Structure */}
            <section className="space-y-3 sm:space-y-4">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500">Layout</h3>
              
              <div className="p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Two Column Layout</h4>
                    <p className="text-[10px] sm:text-xs text-gray-400">Split content into two columns</p>
                  </div>
                  <button
                    onClick={() => setCustomization(prev => ({ ...prev, layout: { ...prev.layout, isTwoColumn: !prev.layout.isTwoColumn } }))}
                    className={cn(
                      "w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors relative",
                      customization.layout.isTwoColumn ? "bg-purple-500" : "bg-white/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full bg-white transition-all",
                      customization.layout.isTwoColumn ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-white/10">
                  <h4 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Spacing</h4>
                  <div className="flex gap-1.5 sm:gap-2">
                    {['compact', 'normal', 'spacious'].map((spacing) => (
                      <button
                        key={spacing}
                        onClick={() => setCustomization(prev => ({ ...prev, layout: { ...prev.layout, spacing: spacing as any } }))}
                        className={cn(
                          "flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold capitalize transition-all",
                          customization.layout.spacing === spacing
                            ? "bg-white text-black"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {spacing}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section Ordering & Visibility */}
            <section className="space-y-3 sm:space-y-4">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500">Sections</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {customization.layout.order.map((section, index) => {
                  const isHidden = customization.layout.hiddenSections.includes(section);
                  return (
                    <div key={section} className="flex items-center justify-between p-2 sm:p-3 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                              const newOrder = [...customization.layout.order];
                              [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                              setCustomization(prev => ({ ...prev, layout: { ...prev.layout, order: newOrder } }));
                            }}
                            className="text-gray-500 hover:text-white disabled:opacity-30 p-0.5"
                          >
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button 
                            disabled={index === customization.layout.order.length - 1}
                            onClick={() => {
                              const newOrder = [...customization.layout.order];
                              [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                              setCustomization(prev => ({ ...prev, layout: { ...prev.layout, order: newOrder } }));
                            }}
                            className="text-gray-500 hover:text-white disabled:opacity-30 p-0.5"
                          >
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white capitalize">{section}</span>
                      </div>
                      <button
                        onClick={() => {
                          setCustomization(prev => {
                            const hidden = prev.layout.hiddenSections;
                            return {
                              ...prev,
                              layout: {
                                ...prev.layout,
                                hiddenSections: isHidden ? hidden.filter(s => s !== section) : [...hidden, section]
                              }
                            };
                          });
                        }}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-lg transition-colors",
                          isHidden ? "text-gray-500 hover:text-white bg-white/5" : "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
                        )}
                        title={isHidden ? "Show section" : "Hide section"}
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide bg-white/2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 sm:py-3 px-1 sm:px-2 min-w-[64px] sm:min-w-[80px] transition-all border-b-2",
                    activeTab === tab.id 
                      ? "border-white text-white bg-white/5" 
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/2"
                  )}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            {(Array.isArray(exp.description) ? exp.description : typeof exp.description === 'string' ? [exp.description] : []).map((bullet, index) => (
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </>
        )}
      </div>

      {/* Preview Pane */}
        <div className={cn(
          "flex-grow bg-[#111] overflow-y-auto p-4 sm:p-8 md:p-12 transition-all",
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
                className="flex items-center gap-2 bg-white text-black px-4 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-200 transition-all"
              >
                <Eye className="w-4 h-4" /> Preview & Download
              </button>
            </div>
            <div className="pb-8 w-full flex justify-center">
              <div 
                className="w-full max-w-[800px] relative bg-white rounded-lg shadow-2xl overflow-hidden" 
                style={{ containerType: 'inline-size', aspectRatio: '1 / 1.414' }}
              >
                <div 
                  className="absolute top-0 left-0 w-[800px] origin-top-left" 
                  style={{ transform: 'scale(calc(100cqw / 800))' }}
                >
                  <ResumePreview content={content} template={template} customization={customization} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {content && (
        <AIReviewModal
          isOpen={showAIReview}
          onClose={() => setShowAIReview(false)}
          content={content}
          onApplyEdit={applyAIEdit}
        />
      )}
    </div>
  );
};
