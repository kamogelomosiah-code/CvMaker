import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Plus, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeContent } from '../types';
import { INITIAL_RESUME_CONTENT } from '../constants';
import * as mammoth from 'mammoth';

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManual: () => void;
  onImportComplete: (content: ResumeContent) => void;
}

export const CreateResumeModal: React.FC<CreateResumeModalProps> = ({ 
  isOpen, 
  onClose, 
  onManual, 
  onImportComplete 
}) => {
  const [step, setStep] = useState<'choice' | 'upload' | 'parsing' | 'review'>('choice');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<ResumeContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    
    if (validTypes.includes(selectedFile.type) || validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      setFile(selectedFile);
      setStep('parsing');
      parseResume(selectedFile);
    } else {
      setError("Please upload a PDF, Word document, or TXT file.");
    }
  };

  const parseResume = async (file: File) => {
    setParsing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Extract resume information from this file into a structured JSON format. 
      The JSON must strictly follow this schema:
      {
        "personalInfo": { "fullName": string, "email": string, "phone": string, "location": string, "website": string, "summary": string },
        "experience": [{ "id": string, "jobTitle": string, "company": string, "location": string, "startDate": string, "endDate": string, "description": string[] }],
        "education": [{ "id": string, "school": string, "degree": string, "location": string, "startDate": string, "endDate": string, "description": string[] }],
        "skills": string[],
        "projects": [{ "id": string, "name": string, "description": string, "link": string }]
      }
      If a field is missing, use an empty string or empty array. Generate unique IDs for experience, education, and projects.`;

      let response;

      if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || file.type.includes('word')) {
        // Extract text using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { text: `Here is the text extracted from the resume document:\n\n${text}` }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
      } else {
        // PDF or TXT
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type || 'application/pdf', data: base64Data } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
      }

      const data = JSON.parse(response.text || "{}") as ResumeContent;
        
        // Ensure descriptions are arrays and IDs exist
        if (data.experience) {
          data.experience = data.experience.map(exp => {
            let descArray: string[] = [];
            const rawDesc = exp.description as any;
            if (Array.isArray(rawDesc)) {
              descArray = rawDesc;
            } else if (typeof rawDesc === 'string') {
              descArray = rawDesc.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
            }
            if (descArray.length === 0) descArray = [''];
            return { 
              ...exp, 
              id: exp.id || Math.random().toString(36).substr(2, 9),
              jobTitle: exp.jobTitle || '',
              company: exp.company || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              description: descArray 
            };
          });
        } else {
          data.experience = [];
        }

        if (data.education) {
          data.education = data.education.map(edu => {
            let descArray: string[] = [];
            const rawDesc = edu.description as any;
            if (Array.isArray(rawDesc)) {
              descArray = rawDesc;
            } else if (typeof rawDesc === 'string') {
              descArray = rawDesc.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
            }
            if (descArray.length === 0) descArray = [''];
            return { 
              ...edu, 
              id: edu.id || Math.random().toString(36).substr(2, 9),
              school: edu.school || '',
              degree: edu.degree || '',
              location: edu.location || '',
              startDate: edu.startDate || '',
              endDate: edu.endDate || '',
              description: descArray 
            };
          });
        } else {
          data.education = [];
        }

        if (data.projects) {
          data.projects = data.projects.map(proj => ({
            ...proj,
            id: proj.id || Math.random().toString(36).substr(2, 9),
            name: proj.name || '',
            description: proj.description || '',
            link: proj.link || ''
          }));
        } else {
          data.projects = [];
        }

        if (!data.skills) data.skills = [];
        if (!data.personalInfo) {
          data.personalInfo = INITIAL_RESUME_CONTENT.personalInfo;
        } else {
          data.personalInfo = { 
            fullName: data.personalInfo.fullName || '',
            email: data.personalInfo.email || '',
            phone: data.personalInfo.phone || '',
            location: data.personalInfo.location || '',
            website: data.personalInfo.website || '',
            summary: data.personalInfo.summary || ''
          };
        }

        setExtractedData(data);
        setStep('review');
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try manual entry.");
      setStep('choice');
    } finally {
      setParsing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#0A0A0A] w-full max-w-xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Create New Resume</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {step === 'choice' && (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setStep('upload')}
                    className="group p-6 bg-white/5 border border-white/5 rounded-3xl text-left hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Import Existing</h3>
                        <p className="text-sm text-gray-500">Upload PDF, Word, or TXT to auto-fill</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Our AI will analyze your current resume and extract your experience, education, and skills automatically.
                    </p>
                  </button>

                  <button
                    onClick={onManual}
                    className="group p-6 bg-white/5 border border-white/5 rounded-3xl text-left hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Start from Scratch</h3>
                        <p className="text-sm text-gray-500">Manual entry with guided flow</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Build your resume step-by-step with professional tips and smart suggestions.
                    </p>
                  </button>
                </div>
              )}

              {step === 'upload' && (
                <div className="space-y-6">
                  <div 
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all relative ${
                      isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/30'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-16 h-16 bg-white/5 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Upload your resume</h3>
                    <p className="text-sm text-gray-500">Drag and drop or click to browse (PDF, Word, TXT)</p>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}
                  <button
                    onClick={() => setStep('choice')}
                    className="w-full py-3 text-gray-500 font-bold hover:text-white transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}

              {step === 'parsing' && (
                <div className="py-12 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <Loader2 className="w-20 h-20 text-white animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing your resume...</h3>
                    <p className="text-gray-500">Our AI is extracting your professional details.</p>
                  </div>
                </div>
              )}

              {step === 'review' && extractedData && (
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                      <h3 className="font-bold text-white">Extraction Complete!</h3>
                    </div>
                    <div className="space-y-3 text-sm text-gray-400">
                      <p>• {extractedData.experience.length} work experiences found</p>
                      <p>• {extractedData.education.length} education entries found</p>
                      <p>• {extractedData.skills.length} skills identified</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('upload')}
                      className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                    >
                      Try Another
                    </button>
                    <button
                      onClick={() => onImportComplete(extractedData)}
                      className="flex-2 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-lg"
                    >
                      Looks Good, Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
