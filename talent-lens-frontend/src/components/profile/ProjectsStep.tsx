"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { ProfileProject, ProfileCertification, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

let uid = Date.now();
const nextId = () => `p_${++uid}`;

export default function ProjectsStep({ data, onChange }: Props) {
  /* ── Projects ── */
  const addProj = () => {
    onChange({
      projects: [
        ...data.projects,
        { id: nextId(), name: "", description: "", technologies: [], role: "", link: "", startDate: "", endDate: "" },
      ],
    });
  };

  const updateProj = (id: string, patch: Partial<ProfileProject>) => {
    onChange({ projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  const removeProj = (id: string) => {
    onChange({ projects: data.projects.filter((p) => p.id !== id) });
  };

  /* ── Certifications ── */
  const addCert = () => {
    onChange({
      certifications: [
        ...data.certifications,
        { id: nextId(), name: "", issuer: "", issueDate: "" },
      ],
    });
  };

  const updateCert = (id: string, patch: Partial<ProfileCertification>) => {
    onChange({ certifications: data.certifications.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };

  const removeCert = (id: string) => {
    onChange({ certifications: data.certifications.filter((c) => c.id !== id) });
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{ color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(47,111,228,0.25)" }}
        >
          Step 5 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Projects
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Portfolio projects demonstrate practical skills. Required by the Umurava schema.
        </p>
      </div>

      {/* Projects */}
      <div className="flex flex-col gap-3 mb-4">
        {data.projects.map((proj, idx) => (
          <ProjectCard key={proj.id} proj={proj} idx={idx} onUpdate={(p) => updateProj(proj.id, p)} onRemove={() => removeProj(proj.id)} />
        ))}
      </div>

      <button
        onClick={addProj}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
        style={{ border: "1.5px dashed var(--border2)", background: "transparent", color: "var(--text3)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}
      >
        + Add project
      </button>

      {/* Certifications */}
      <div className="mt-8">
        <label className="text-[11px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--text2)" }}>
          Certifications <span className="normal-case font-normal tracking-normal" style={{ color: "var(--text3)" }}>(optional)</span>
        </label>

        <div className="flex flex-col gap-3 mb-4">
          {data.certifications.map((cert, idx) => (
            <div
              key={cert.id}
              className="rounded-[14px] p-5 transition-colors"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
                  Certification {idx + 1}
                </span>
                <button
                  onClick={() => removeCert(cert.id)}
                  className="w-[26px] h-[26px] rounded-md flex items-center justify-center transition-all"
                  style={{ background: "var(--red-dim)", color: "var(--red)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--red-dim)"; e.currentTarget.style.color = "var(--red)"; }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                    Certificate Name
                  </label>
                  <input
                    type="text"
                    placeholder="AWS Certified Developer"
                    value={cert.name}
                    onChange={(e) => updateCert(cert.id, { name: e.target.value })}
                    className="profile-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                    Issuer
                  </label>
                  <input
                    type="text"
                    placeholder="Amazon"
                    value={cert.issuer}
                    onChange={(e) => updateCert(cert.id, { issuer: e.target.value })}
                    className="profile-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                    Issue Date
                  </label>
                  <input
                    type="month"
                    value={cert.issueDate}
                    onChange={(e) => updateCert(cert.id, { issueDate: e.target.value })}
                    className="profile-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCert}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{ border: "1.5px dashed var(--border2)", background: "transparent", color: "var(--text3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}
        >
          + Add certification
        </button>
      </div>
    </div>
  );
}

/* ── Project card sub-component ── */
function ProjectCard({
  proj,
  idx,
  onUpdate,
  onRemove,
}: {
  proj: ProfileProject;
  idx: number;
  onUpdate: (patch: Partial<ProfileProject>) => void;
  onRemove: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,$/, "");
      if (!val) return;
      onUpdate({ technologies: [...proj.technologies, val] });
      setTagInput("");
    }
  };

  const removeTag = (i: number) => {
    onUpdate({ technologies: proj.technologies.filter((_, j) => j !== i) });
  };

  return (
    <div
      className="rounded-[14px] p-5 transition-colors"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
          Project {idx + 1}
        </span>
        <button
          onClick={onRemove}
          className="w-[26px] h-[26px] rounded-md flex items-center justify-center transition-all"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--red-dim)"; e.currentTarget.style.color = "var(--red)"; }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Project Name<span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. AI Recruitment System"
            value={proj.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="profile-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Your Role
          </label>
          <input
            type="text"
            placeholder="e.g. Lead Backend Engineer"
            value={proj.role}
            onChange={(e) => onUpdate({ role: e.target.value })}
            className="profile-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
          Description<span style={{ color: "var(--red)" }}>*</span>
        </label>
        <textarea
          placeholder="What did this project do? What problem did it solve?"
          value={proj.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="profile-input min-h-[80px] resize-y"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Technologies
          </label>
          <div
            className="flex flex-wrap gap-1.5 p-2 rounded-xl min-h-[42px] cursor-text transition-all"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
            onClick={(e) => { (e.currentTarget as HTMLDivElement).querySelector("input")?.focus(); }}
          >
            {proj.technologies.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px]"
                style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(47,111,228,0.25)" }}
              >
                {t}
                <span className="cursor-pointer opacity-70 hover:opacity-100 text-[14px] leading-none" onClick={() => removeTag(i)}>×</span>
              </span>
            ))}
            <input
              type="text"
              placeholder="Type tech and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              className="border-none outline-none bg-transparent text-[13px] flex-1 min-w-[80px]"
              style={{ color: "var(--text)" }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Project Link (optional)
          </label>
          <input
            type="url"
            placeholder="https://github.com/..."
            value={proj.link}
            onChange={(e) => onUpdate({ link: e.target.value })}
            className="profile-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>Start Date</label>
          <input type="month" value={proj.startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} className="profile-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>End Date</label>
          <input type="month" value={proj.endDate} onChange={(e) => onUpdate({ endDate: e.target.value })} className="profile-input" />
        </div>
      </div>
    </div>
  );
}
