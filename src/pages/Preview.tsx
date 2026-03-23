import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Resume } from '../types';
import { TEMPLATES } from '../constants';
import { ResumePreview } from '../components/ResumePreview';
import { Download, Share2, Printer, ChevronLeft, FileText, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const Preview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [margin, setMargin] = useState<number>(0);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchResume = async () => {
      const docRef = doc(db, 'resumes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Resume;
        setResume(data);
        setSelectedTemplateId(data.templateId);
      }
      setLoading(false);
    };
    fetchResume();
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: resume?.title || 'Resume',
  });

  const downloadPDF = async () => {
    if (!componentRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', paperSize);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      pdf.save(`${resume?.title || 'resume'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        Resume not found
      </div>
    );
  }

  const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/builder/${resume.id}`)}
              className="p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{resume.title}</h1>
              <p className="text-sm text-gray-500">Preview and export your resume</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-xl font-bold border border-white/5 hover:bg-white/10 transition-all"
            >
              <Printer className="w-5 h-5" /> Print
            </button>
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-lg disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Preview */}
          <div className="flex-grow flex justify-center pb-4 sm:pb-0">
            <div className="w-full max-w-[800px] relative bg-white rounded-lg shadow-2xl overflow-hidden" style={{ containerType: 'inline-size', aspectRatio: '1 / 1.414' }}>
              <div 
                className="absolute top-0 left-0 w-[800px] origin-top-left" 
                style={{ transform: 'scale(calc(100cqw / 800))' }}
              >
                <div ref={componentRef} className="w-[800px] h-[1131px] bg-white">
                  <ResumePreview content={resume.content} template={template} customization={resume.customization} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Control Panel */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Export Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Paper Size</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaperSize('a4')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                        paperSize === 'a4' ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                      )}
                    >
                      A4
                    </button>
                    <button
                      onClick={() => setPaperSize('letter')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                        paperSize === 'letter' ? "bg-white text-black border-white" : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                      )}
                    >
                      Letter
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Margin (mm): {margin}</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

