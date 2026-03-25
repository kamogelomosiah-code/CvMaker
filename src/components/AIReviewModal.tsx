import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ResumeContent } from '../types';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ResumeContent;
  onApplyEdit: (edit: AISuggestion) => void;
}

export interface AISuggestion {
  id: string;
  type: 'summary' | 'experience';
  itemId?: string;
  bulletIndex?: number;
  originalText: string;
  suggestedText: string;
  reason: string;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  content,
  onApplyEdit
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [hasRun, setHasRun] = useState(false);

  const runReview = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAppliedIds(new Set());
    setHasRun(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `You are an expert resume reviewer and career coach. Review the following resume JSON.
      Provide 3-5 specific improvements for the summary and experience descriptions to make them more impactful, ATS-friendly, and action-oriented. Focus on quantifying results and using strong action verbs.
      
      Return strictly a JSON array of objects with this exact schema:
      [
        {
          "type": "summary" | "experience",
          "itemId": "string (the id of the experience, null if summary)",
          "bulletIndex": "number (the index of the description array, null if summary)",
          "originalText": "string (the exact original text)",
          "suggestedText": "string (the improved text)",
          "reason": "string (brief explanation of why this is better)"
        }
      ]
      
      Resume JSON:
      ${JSON.stringify(content, null, 2)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "[]");
      const validSuggestions = Array.isArray(data) ? data.map((s: any, i: number) => ({
        ...s,
        id: `sug-${i}-${Date.now()}`
      })) : [];

      setSuggestions(validSuggestions);
    } catch (err) {
      console.error("AI Review Error:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestion: AISuggestion) => {
    onApplyEdit(suggestion);
    setAppliedIds(prev => new Set(prev).add(suggestion.id));
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
            className="relative bg-[#0A0A0A] w-full max-w-3xl max-h-[80vh] flex flex-col rounded-[32px] border border-white/5 shadow-2xl overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Resume Review</h2>
                  <p className="text-sm text-gray-400">Get smart suggestions to improve your resume</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
              {!hasRun && !loading && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-blue-500/50 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Ready to review your resume?</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-8">
                    Our AI will analyze your summary and experience sections to suggest more impactful, action-oriented phrasing.
                  </p>
                  <button
                    onClick={runReview}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
                  >
                    Start AI Review
                  </button>
                </div>
              )}

              {loading && (
                <div className="py-20 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400/50" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing your resume...</h3>
                    <p className="text-gray-500">Looking for ways to make your experience stand out.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={runReview}
                    className="bg-white/10 text-white px-6 py-2 rounded-full font-bold hover:bg-white/20 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">Suggested Improvements ({suggestions.length})</h3>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          suggestions.forEach(s => {
                            if (!appliedIds.has(s.id)) {
                              handleApply(s);
                            }
                          });
                        }}
                        className="text-sm text-green-400 hover:text-green-300 font-bold"
                      >
                        Apply All
                      </button>
                      <button 
                        onClick={runReview}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                  
                  {suggestions.map((suggestion) => {
                    const isApplied = appliedIds.has(suggestion.id);
                    return (
                      <div key={suggestion.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                            {suggestion.type === 'summary' ? 'Summary' : 'Experience'}
                          </span>
                          {isApplied ? (
                            <span className="flex items-center gap-1 text-green-400 text-sm font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApply(suggestion)}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors"
                            >
                              Apply Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Original</p>
                            <p className="text-sm text-gray-400 line-through decoration-red-500/50">{suggestion.originalText}</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-1">Suggested</p>
                            <p className="text-sm text-white">{suggestion.suggestedText}</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl">
                            <p className="text-xs text-gray-400"><span className="font-bold text-gray-300">Why:</span> {suggestion.reason}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {!loading && hasRun && suggestions.length === 0 && !error && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Looks great!</h3>
                  <p className="text-gray-400">We couldn't find any major improvements for your resume right now.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
