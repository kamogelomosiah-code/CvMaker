import React from 'react';
import { ResumeContent, ResumeCustomization } from '../types';
import { cn } from '../lib/utils';
import { DEFAULT_CUSTOMIZATION } from '../constants';

interface ResumePreviewProps {
  content: ResumeContent;
  customization?: ResumeCustomization;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ content, customization = DEFAULT_CUSTOMIZATION }) => {
  const { personalInfo, experience, education, skills, projects } = content;
  const { colors, layout } = customization;

  if (!personalInfo) return null;

  const accentColor = colors.primary;

  const renderSection = (sectionName: string) => {
    if (layout.hiddenSections?.includes(sectionName)) return null;

    switch (sectionName) {
      case 'summary':
        return personalInfo.summary ? (
          <section key="summary" className="mb-10">
            <h2 className="text-xs font-display font-bold uppercase tracking-[0.2em] mb-4 text-[#111]">Profile</h2>
            <p className="text-[13px] font-sans leading-[1.8] text-[#333]">
              {personalInfo.summary}
            </p>
          </section>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <section key="experience" className="mb-10">
            <h2 className="text-xs font-display font-bold uppercase tracking-[0.2em] mb-6 text-[#111]">Experience</h2>
            <div className="space-y-8">
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-6">
                  {/* Subtle Accent Line */}
                  <div className="absolute left-0 top-1.5 bottom-0 w-[1px] bg-[#EEEEEE]" />
                  <div 
                    className="absolute left-[-2px] top-1.5 w-[5px] h-[5px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                    <h3 className="font-display font-bold text-[#111] text-sm uppercase tracking-wider">{exp.jobTitle}</h3>
                    <span className="text-[11px] font-sans font-medium text-[#777] uppercase tracking-wider mt-1 sm:mt-0 whitespace-nowrap">
                      {exp.startDate} — {exp.endDate || "Present"}
                    </span>
                  </div>
                  <p className="text-[12px] font-display font-semibold text-[#555] mb-3 uppercase tracking-wider">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</p>
                  <ul className="text-[13px] font-sans leading-[1.8] text-[#444] list-none space-y-2">
                    {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                      <li key={i} className="relative pl-4">
                        <span className="absolute left-0 top-[0.6em] w-[4px] h-[1px] bg-[#999]" />
                        {bullet}
                      </li>
                    )) : typeof exp.description === 'string' ? (
                      <li className="relative pl-4">
                        <span className="absolute left-0 top-[0.6em] w-[4px] h-[1px] bg-[#999]" />
                        {exp.description}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <section key="education" className="mb-10">
            <h2 className="text-xs font-display font-bold uppercase tracking-[0.2em] mb-6 text-[#111]">Education</h2>
            <div className="space-y-8">
              {education.map((edu) => (
                <div key={edu.id} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 bottom-0 w-[1px] bg-[#EEEEEE]" />
                  <div 
                    className="absolute left-[-2px] top-1.5 w-[5px] h-[5px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                    <h3 className="font-display font-bold text-[#111] text-sm uppercase tracking-wider">{edu.degree}</h3>
                    <span className="text-[11px] font-sans font-medium text-[#777] uppercase tracking-wider mt-1 sm:mt-0 whitespace-nowrap">
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <p className="text-[12px] font-display font-semibold text-[#555] uppercase tracking-wider">{edu.school}{edu.location ? ` • ${edu.location}` : ''}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case 'skills':
        return skills.length > 0 ? (
          <section key="skills" className="mb-10">
            <h2 className="text-xs font-display font-bold uppercase tracking-[0.2em] mb-6 text-[#111]">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span 
                  key={i} 
                  className="text-[11px] font-sans font-medium px-3 py-1.5 rounded-full border border-[#EEEEEE] text-[#333]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <section key="projects" className="mb-10">
            <h2 className="text-xs font-display font-bold uppercase tracking-[0.2em] mb-6 text-[#111]">Projects</h2>
            <div className="space-y-8">
              {projects.map((proj) => (
                <div key={proj.id} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 bottom-0 w-[1px] bg-[#EEEEEE]" />
                  <div 
                    className="absolute left-[-2px] top-1.5 w-[5px] h-[5px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                    <h3 className="font-display font-bold text-[#111] text-sm uppercase tracking-wider">{proj.name}</h3>
                    {proj.link && <span className="text-[11px] font-sans font-medium text-[#777]" style={{ color: accentColor }}>{proj.link}</span>}
                  </div>
                  <p className="text-[13px] font-sans leading-[1.8] text-[#444]">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-preview"
      className="bg-white w-full h-full flex flex-col p-12 sm:p-16 lg:p-20 overflow-hidden break-words box-border"
    >
      {/* Header */}
      <header className="mb-12 border-b border-[#EEEEEE] pb-8">
        <h1 className="text-5xl font-display font-extrabold tracking-tighter text-[#000] mb-4 uppercase">
          {personalInfo.fullName || "Your Name"}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-sans font-medium uppercase tracking-widest text-[#777]">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span style={{ color: accentColor }}>{personalInfo.website}</span>}
        </div>
      </header>

      <div className={cn("flex-grow", layout?.isTwoColumn ? "grid grid-cols-12 gap-12" : "flex flex-col")}>
        {layout?.isTwoColumn ? (
          <>
            <div className="col-span-8">
              {(layout.order || ['summary', 'experience', 'projects']).filter(s => ['summary', 'experience', 'projects'].includes(s)).map(renderSection)}
            </div>
            <div className="col-span-4 pl-4 border-l border-[#EEEEEE]">
              {(layout.order || ['skills', 'education']).filter(s => ['skills', 'education'].includes(s)).map(renderSection)}
            </div>
          </>
        ) : (
          <div className="w-full">
            {(layout?.order || ['summary', 'experience', 'education', 'skills', 'projects']).map(renderSection)}
          </div>
        )}
      </div>
    </div>
  );
};
