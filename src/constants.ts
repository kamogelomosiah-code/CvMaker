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
    id: "sleek-dark",
    name: "Sleek Dark",
    thumbnailUrl: "https://picsum.photos/seed/sleekdark/400/600",
    category: "Modern",
    styles: {
      primaryColor: "#FFFFFF",
      fontFamily: "Poppins",
    },
  },
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
  {
    id: "classic-1",
    name: "Executive Classic",
    thumbnailUrl: "https://picsum.photos/seed/classic1/400/600",
    category: "Classic",
    styles: {
      primaryColor: "#1f2937",
      fontFamily: "Georgia",
    },
  },
  {
    id: "creative-1",
    name: "Creative Minimalist",
    thumbnailUrl: "https://picsum.photos/seed/creative1/400/600",
    category: "Creative",
    styles: {
      primaryColor: "#db2777",
      fontFamily: "Outfit",
    },
  },
];
