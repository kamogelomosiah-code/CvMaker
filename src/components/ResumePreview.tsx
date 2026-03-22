import React from 'react';
import { ResumeContent, Template } from '../types';
import { cn } from '../lib/utils';

interface ResumePreviewProps {
  content: ResumeContent;
  template: Template;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ content, template }) => {
  const { personalInfo, experience, education, skills, projects } = content;

  if (!personalInfo) return null;

  if (template.id === 'sleek-dark') {
    return (
      <div
        id="resume-preview"
        className="bg-[#0A0A0A] text-white shadow-2xl mx-auto w-full aspect-[1/1.414] p-16 overflow-hidden flex flex-col"
        style={{ fontFamily: 'Poppins' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex flex-col">
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.8] mb-2 uppercase">
              {personalInfo.fullName?.split(' ')[0] || "Your"}
            </h1>
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.8] uppercase text-gray-600">
              {personalInfo.fullName?.split(' ').slice(1).join(' ') || "Name"}
            </h1>
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-500 space-y-2">
            <p className="hover:text-white transition-colors cursor-default">{personalInfo.phone || "+00 000 000 0000"}</p>
            <p className="hover:text-white transition-colors cursor-default">{personalInfo.email || "hello@example.com"}</p>
            <p className="hover:text-white transition-colors cursor-default">{personalInfo.location || "City, Country"}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-16 flex-grow">
          {/* Left Column */}
          <div className="col-span-4 space-y-16">
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-600">Profile</h2>
              <p className="text-[11px] leading-relaxed text-gray-400 font-medium">
                {personalInfo.summary || "Professional summary goes here. Keep it concise and impactful."}
              </p>
            </section>

            {skills.length > 0 && (
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-600">Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-600">Education</h2>
                <div className="space-y-8">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <h3 className="text-[11px] font-bold text-white mb-1 uppercase tracking-wider">{edu.degree}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{edu.school}</p>
                      <p className="text-[10px] font-medium text-gray-600">{edu.startDate} — {edu.endDate}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-8 space-y-16">
            {experience.length > 0 && (
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-10 text-gray-600">Experience</h2>
                <div className="space-y-12">
                  {experience.map((exp) => (
                    <div key={exp.id} className="group">
                      <div className="flex justify-between items-baseline mb-3">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-gray-300 transition-colors">{exp.jobTitle}</h3>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{exp.startDate} — {exp.endDate || "Present"}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">{exp.company}</p>
                      <ul className="text-[11px] text-gray-400 leading-relaxed font-medium list-disc list-inside space-y-1">
                        {exp.description.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-10 text-gray-600">Selected Projects</h2>
                <div className="space-y-8">
                  {projects.map((proj) => (
                    <div key={proj.id}>
                      <h3 className="text-[11px] font-bold text-white mb-2 uppercase tracking-wider">{proj.name}</h3>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-2xl mx-auto w-full aspect-[1/1.414] p-12 overflow-hidden"
      style={{ fontFamily: template.styles.fontFamily, color: '#1f2937' }}
    >
      {/* Header */}
      <header className="mb-8 border-b-2 pb-6" style={{ borderColor: template.styles.primaryColor }}>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: template.styles.primaryColor }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 font-medium">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: template.styles.primaryColor }}>
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">{personalInfo.summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: template.styles.primaryColor }}>
            Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">{exp.jobTitle}</h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {exp.startDate} — {exp.endDate || "Present"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold text-gray-700">{exp.company}</span>
                  <span className="text-xs text-gray-400 italic">{exp.location}</span>
                </div>
                <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
                  {exp.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: template.styles.primaryColor }}>
            Education
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-700">{edu.school}</span>
                  <span className="text-xs text-gray-400 italic">{edu.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: template.styles.primaryColor }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded border border-gray-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: template.styles.primaryColor }}>
            Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">{proj.name}</h3>
                  {proj.link && <span className="text-xs text-blue-600 font-medium">{proj.link}</span>}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
