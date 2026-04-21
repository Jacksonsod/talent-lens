"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { ProfileExperience, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

let uid = Date.now();
const nextId = () => `exp_${++uid}`;

export default function ExperienceStep({ data, onChange }: Props) {
  const addExp = () => {
    onChange({
      experience: [
        ...data.experience,
        {
          id: nextId(),
          company: "",
          role: "",
          startDate: "",
          endDate: "",
          description: "",
          technologies: [],
          isCurrent: false,
        },
      ],
    });
  };

  const updateExp = (id: string, patch: Partial<ProfileExperience>) => {
    onChange({
      experience: data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeExp = (id: string) => {
    onChange({ experience: data.experience.filter((e) => e.id !== id) });
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-7">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{
            color: "var(--accent)",
            background: "var(--accent-dim)",
            border: "1px solid rgba(47,111,228,0.25)",
          }}
        >
          Step 3 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Work Experience
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Full employment history. The more detail provided, the better the AI can evaluate this candidate.
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 mb-4">
        {data.experience.map((exp, idx) => (
          <ExperienceCard
            key={exp.id}
            exp={exp}
            idx={idx}
            onUpdate={(patch) => updateExp(exp.id, patch)}
            onRemove={() => removeExp(exp.id)}
          />
        ))}
      </div>

      <button
        onClick={addExp}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
        style={{ border: "1.5px dashed var(--border2)", background: "transparent", color: "var(--text3)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.color = "var(--accent)";
          e.currentTarget.style.background = "var(--accent-dim)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border2)";
          e.currentTarget.style.color = "var(--text3)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        + Add work experience
      </button>
    </div>
  );
}

/* ── Individual experience card ── */
function ExperienceCard({
  exp,
  idx,
  onUpdate,
  onRemove,
}: {
  exp: ProfileExperience;
  idx: number;
  onUpdate: (patch: Partial<ProfileExperience>) => void;
  onRemove: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,$/, "");
      if (!val) return;
      onUpdate({ technologies: [...exp.technologies, val] });
      setTagInput("");
    }
  };

  const removeTag = (i: number) => {
    onUpdate({ technologies: exp.technologies.filter((_, j) => j !== i) });
  };

  return (
    <div
      className="rounded-[14px] p-5 transition-colors"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
          Position {idx + 1}
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
            Company<span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Company Name"
            value={exp.company}
            onChange={(e) => onUpdate({ company: e.target.value })}
            className="profile-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Role / Title<span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Backend Engineer"
            value={exp.role}
            onChange={(e) => onUpdate({ role: e.target.value })}
            className="profile-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Start Date<span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            type="month"
            value={exp.startDate}
            onChange={(e) => onUpdate({ startDate: e.target.value })}
            className="profile-input"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            End Date
          </label>
          <input
            type="month"
            value={exp.endDate}
            onChange={(e) => onUpdate({ endDate: e.target.value })}
            disabled={exp.isCurrent}
            className="profile-input"
            style={{ opacity: exp.isCurrent ? 0.5 : 1 }}
          />
        </div>
      </div>

      {/* Currently working */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          id={`curr_${exp.id}`}
          checked={exp.isCurrent}
          onChange={(e) => onUpdate({ isCurrent: e.target.checked, endDate: e.target.checked ? "" : exp.endDate })}
          className="w-4 h-4 accent-[var(--accent)]"
        />
        <label htmlFor={`curr_${exp.id}`} className="text-[13px] cursor-pointer" style={{ color: "var(--text2)" }}>
          Currently working here
        </label>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
          Description
        </label>
        <textarea
          placeholder="Key responsibilities, achievements, impact..."
          value={exp.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="profile-input min-h-[80px] resize-y"
          rows={3}
        />
      </div>

      {/* Technologies tag input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
          Technologies Used
        </label>
        <div
          className="flex flex-wrap gap-1.5 p-2 rounded-xl min-h-[42px] cursor-text transition-all"
          style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
          onClick={(e) => {
            const input = (e.currentTarget as HTMLDivElement).querySelector("input");
            input?.focus();
          }}
        >
          {exp.technologies.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px]"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(47,111,228,0.25)",
              }}
            >
              {t}
              <span
                className="cursor-pointer opacity-70 hover:opacity-100 text-[14px] leading-none"
                onClick={() => removeTag(i)}
              >
                ×
              </span>
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
    </div>
  );
}
