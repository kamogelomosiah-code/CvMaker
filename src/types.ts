export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  planType: 'free' | 'premium';
  createdAt: any;
}

export interface ResumeContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string[];
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string[];
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    link: string;
  }>;
}

export interface ResumeCustomization {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  layout: {
    order: string[];
    isTwoColumn: boolean;
    spacing: 'compact' | 'normal' | 'spacious';
    hiddenSections: string[];
  };
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  content: ResumeContent;
  customization?: ResumeCustomization;
  lastEdited: any;
  isDeleted?: boolean;
}

export interface Template {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: 'Modern' | 'Classic' | 'Creative' | 'ATS-Friendly';
  styles: any;
}
