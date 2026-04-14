"use client";

import { X } from "lucide-react";
import type { ProfileSkill, ProfileLanguage, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const PROFICIENCIES = ["Basic", "Conversational", "Fluent", "Native"] as const;

const levelColors: Record<string, { bg: string; border: string; text: string }> = {
  Beginner:     { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  Intermediate: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  Advanced:     { bg: "#ede9fe", border: "#8b5cf6", text: "#4c1d95" },
  Expert:       { bg: "#d1fae5", border: "#10b981", text: "#064e3b" },
};

let uid = Date.now();
const nextId = () => `sk_${++uid}`;

export default function SkillsStep({ data, onChange }: Props) {
  const addSkill = () => {
    onChange({
      skills: [
        ...data.skills,
        { id: nextId(), name: "", level: "Intermediate", yearsOfExperience: 0 },
      ],
    });
  };

  const updateSkill = (id: string, patch: Partial<ProfileSkill>) => {
    onChange({
      skills: data.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeSkill = (id: string) => {
    onChange({ skills: data.skills.filter((s) => s.id !== id) });
  };

  const addLang = () => {
    onChange({
      languages: [
        ...data.languages,
        { id: nextId(), name: "", proficiency: "Fluent" },
      ],
    });
  };

  const updateLang = (id: string, patch: Partial<ProfileLanguage>) => {
    onChange({
      languages: data.languages.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeLang = (id: string) => {
    onChange({ languages: data.languages.filter((l) => l.id !== id) });
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
          Step 2 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Skills & Languages
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Add each skill with proficiency level. Gemini uses skill levels to weight the match score.
        </p>
      </div>

      {/* Skills list */}
      <div className="flex flex-col gap-3 mb-4">
        {data.skills.map((skill, idx) => (
          <div
            key={skill.id}
            className="rounded-[14px] p-5 relative transition-colors"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
                Skill {idx + 1}
              </span>
              <button
                onClick={() => removeSkill(skill.id)}
                className="w-[26px] h-[26px] rounded-md flex items-center justify-center transition-all hover:text-white"
                style={{
                  background: "var(--red-dim)",
                  color: "var(--red)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--red)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--red-dim)";
                  e.currentTarget.style.color = "var(--red)";
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  Skill Name<span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. React"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                  className="profile-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={skill.yearsOfExperience}
                  onChange={(e) =>
                    updateSkill(skill.id, { yearsOfExperience: parseInt(e.target.value) || 0 })
                  }
                  className="profile-input"
                />
              </div>
            </div>

            {/* Level pills */}
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text2)" }}>
              Proficiency Level<span style={{ color: "var(--red)" }}>*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((level) => {
                const active = skill.level === level;
                const col = levelColors[level];
                return (
                  <button
                    key={level}
                    onClick={() => updateSkill(skill.id, { level })}
                    className="px-3 py-[5px] rounded-full text-[11px] font-semibold transition-all"
                    style={{
                      background: active ? col.bg : "transparent",
                      border: `1px solid ${active ? col.border : "var(--border2)"}`,
                      color: active ? col.text : "var(--text3)",
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addSkill}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
        style={{
          border: "1.5px dashed var(--border2)",
          background: "transparent",
          color: "var(--text3)",
        }}
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
        + Add another skill
      </button>

      {/* Languages */}
      <div className="mt-6">
        <label className="text-[11px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--text2)" }}>
          Languages <span className="normal-case font-normal tracking-normal" style={{ color: "var(--text3)" }}>(optional)</span>
        </label>

        <div className="flex flex-col gap-3 mb-4">
          {data.languages.map((lang, idx) => (
            <div
              key={lang.id}
              className="rounded-[14px] p-5 relative transition-colors"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
                  Language {idx + 1}
                </span>
                <button
                  onClick={() => removeLang(lang.id)}
                  className="w-[26px] h-[26px] rounded-md flex items-center justify-center transition-all"
                  style={{ background: "var(--red-dim)", color: "var(--red)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--red)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--red-dim)";
                    e.currentTarget.style.color = "var(--red)";
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                    Language
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English"
                    value={lang.name}
                    onChange={(e) => updateLang(lang.id, { name: e.target.value })}
                    className="profile-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                    Proficiency
                  </label>
                  <select
                    value={lang.proficiency}
                    onChange={(e) =>
                      updateLang(lang.id, {
                        proficiency: e.target.value as ProfileLanguage["proficiency"],
                      })
                    }
                    className="profile-input profile-select"
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addLang}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{
            border: "1.5px dashed var(--border2)",
            background: "transparent",
            color: "var(--text3)",
          }}
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
          + Add language
        </button>
      </div>
    </div>
  );
}
