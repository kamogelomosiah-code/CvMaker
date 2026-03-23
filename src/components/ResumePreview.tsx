import React from 'react';
import { ResumeContent, Template, ResumeCustomization } from '../types';
import { cn } from '../lib/utils';
import { DEFAULT_CUSTOMIZATION } from '../constants';

interface ResumePreviewProps {
  content: ResumeContent;
  template: Template;
  customization?: ResumeCustomization;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ content, template, customization = DEFAULT_CUSTOMIZATION }) => {
  const { personalInfo, experience, education, skills, projects } = content;
  const { colors, layout } = customization;

  if (!personalInfo) return null;

  const renderSection = (sectionName: string) => {
    if (layout.hiddenSections.includes(sectionName)) return null;

    switch (sectionName) {
      case 'summary':
        return personalInfo.summary ? (
          <section key="summary" className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>Profile</h2>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {personalInfo.summary}
            </p>
          </section>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <section key="experience" className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-1" style={{ color: colors.primary, borderColor: colors.secondary }}>Experience</h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs font-medium" style={{ color: colors.secondary }}>{exp.startDate} — {exp.endDate || "Present"}</span>
                  </div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.secondary }}>{exp.company}</p>
                  <ul className="text-sm leading-relaxed list-disc list-inside space-y-1" style={{ color: colors.text }}>
                    {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    )) : typeof exp.description === 'string' ? (
                      <li>{exp.description}</li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <section key="education" className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-1" style={{ color: colors.primary, borderColor: colors.secondary }}>Education</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base" style={{ color: colors.text }}>{edu.degree}</h3>
                    <span className="text-xs font-medium" style={{ color: colors.secondary }}>{edu.startDate} — {edu.endDate}</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: colors.secondary }}>{edu.school}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'skills':
        return skills.length > 0 ? (
          <section key="skills" className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: colors.primary, borderColor: colors.secondary }}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span key={i} className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: `${colors.secondary}20`, color: colors.text }}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <section key="projects" className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-1" style={{ color: colors.primary, borderColor: colors.secondary }}>Projects</h2>
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base" style={{ color: colors.text }}>{proj.name}</h3>
                    {proj.link && <span className="text-xs font-medium" style={{ color: colors.secondary }}>{proj.link}</span>}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  // If it's the sleek-dark template, we might want to keep its specific layout but apply colors
  if (template.id === 'sleek-dark') {
    return (
      <div
        id="resume-preview"
        className="shadow-2xl mx-auto w-full aspect-[1/1.414] p-16 overflow-hidden flex flex-col"
        style={{ fontFamily: 'Poppins', backgroundColor: colors.background, color: colors.text }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex flex-col">
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.8] mb-2 uppercase" style={{ color: colors.primary }}>
              {personalInfo.fullName?.split(' ')[0] || "Your"}
            </h1>
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.8] uppercase" style={{ color: colors.secondary }}>
              {personalInfo.fullName?.split(' ').slice(1).join(' ') || "Name"}
            </h1>
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest space-y-2" style={{ color: colors.secondary }}>
            <p>{personalInfo.phone || "+00 000 000 0000"}</p>
            <p>{personalInfo.email || "hello@example.com"}</p>
            <p>{personalInfo.location || "City, Country"}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-16 flex-grow">
          {/* Left Column */}
          <div className="col-span-4 space-y-16">
            {layout.order.filter(s => ['summary', 'skills', 'education'].includes(s)).map(renderSection)}
          </div>

          {/* Right Column */}
          <div className="col-span-8 space-y-16">
            {layout.order.filter(s => ['experience', 'projects'].includes(s)).map(renderSection)}
          </div>
        </div>
      </div>
    );
  }

  // Generic layout for other templates, applying customizations
  return (
    <div
      id="resume-preview"
      className="shadow-2xl mx-auto w-full aspect-[1/1.414] p-12 overflow-hidden flex flex-col"
      style={{ fontFamily: template.styles.fontFamily || 'Inter', backgroundColor: colors.background, color: colors.text }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-medium" style={{ color: colors.secondary }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
      </div>

      <div className={cn("flex-grow", layout.isTwoColumn ? "grid grid-cols-3 gap-8" : "flex flex-col")}>
        {layout.isTwoColumn ? (
          <>
            <div className="col-span-2 space-y-6">
              {layout.order.filter(s => ['summary', 'experience', 'projects'].includes(s)).map(renderSection)}
            </div>
            <div className="col-span-1 space-y-6">
              {layout.order.filter(s => ['skills', 'education'].includes(s)).map(renderSection)}
            </div>
          </>
        ) : (
          <div className={cn("space-y-6", layout.spacing === 'compact' ? 'space-y-4' : layout.spacing === 'spacious' ? 'space-y-8' : 'space-y-6')}>
            {layout.order.map(renderSection)}
          </div>
        )}
      </div>
    </div>
  );
};
