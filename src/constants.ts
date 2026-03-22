import { ResumeContent, ResumeCustomization } from "./types";

export const INITIAL_RESUME_CONTENT: ResumeContent = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

export const DEFAULT_CUSTOMIZATION: ResumeCustomization = {
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    text: "#0f172a",
    background: "#ffffff",
  },
  layout: {
    order: ['summary', 'experience', 'education', 'skills', 'projects'],
    isTwoColumn: false,
    spacing: 'normal',
    hiddenSections: [],
  },
};

export const COLOR_PALETTES = [
  { name: 'Professional Blue', primary: '#2563eb', secondary: '#64748b', text: '#0f172a', background: '#ffffff' },
  { name: 'Earthy Green', primary: '#16a34a', secondary: '#52525b', text: '#18181b', background: '#fafaf9' },
  { name: 'Bold Red', primary: '#dc2626', secondary: '#71717a', text: '#09090b', background: '#ffffff' },
  { name: 'Elegant Purple', primary: '#7c3aed', secondary: '#64748b', text: '#1e293b', background: '#f8fafc' },
  { name: 'Classic Dark', primary: '#111827', secondary: '#4b5563', text: '#111827', background: '#ffffff' },
];

export const TEMPLATES = [
  {
    id: "modern-1",
    name: "Modern Professional",
    thumbnailUrl: "https://picsum.photos/seed/modern1/400/600",
    category: "Modern",
    styles: {
      primaryColor: "#2563eb",
      fontFamily: "Inter",
    },
  },
];
