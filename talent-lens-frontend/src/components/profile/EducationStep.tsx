"use client";

import { X } from "lucide-react";
import type { ProfileEducation, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

const DEGREES = ["High School", "Associate", "Bachelor's", "Master's", "PhD", "Other"];

let uid = Date.now();
const nextId = () => `edu_${++uid}`;

export default function EducationStep({ data, onChange }: Props) {
  const addEdu = () => {
    onChange({
      education: [
        ...data.education,
        { id: nextId(), institution: "", degree: "Bachelor's", fieldOfStudy: "", startYear: 0, endYear: 0 },
      ],
    });
  };

  const updateEdu = (id: string, patch: Partial<ProfileEducation>) => {
    onChange({
      education: data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeEdu = (id: string) => {
    onChange({ education: data.education.filter((e) => e.id !== id) });
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{ color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(47,111,228,0.25)" }}
        >
          Step 4 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Education
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Academic background including degrees and fields of study.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {data.education.map((edu, idx) => (
          <div
            key={edu.id}
            className="rounded-[14px] p-5 transition-colors"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-semibold" style={{ color: "var(--text2)" }}>
                Education {idx + 1}
              </span>
              <button
                onClick={() => removeEdu(edu.id)}
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
                  Institution<span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="University Name"
                  value={edu.institution}
                  onChange={(e) => updateEdu(edu.id, { institution: e.target.value })}
                  className="profile-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  Degree<span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  value={edu.degree}
                  onChange={(e) => updateEdu(edu.id, { degree: e.target.value })}
                  className="profile-input profile-select"
                >
                  {DEGREES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  Field of Study
                </label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  value={edu.fieldOfStudy}
                  onChange={(e) => updateEdu(edu.id, { fieldOfStudy: e.target.value })}
                  className="profile-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  Start Year
                </label>
                <input
                  type="number"
                  placeholder="2020"
                  min={1950}
                  max={2030}
                  value={edu.startYear || ""}
                  onChange={(e) => updateEdu(edu.id, { startYear: parseInt(e.target.value) || 0 })}
                  className="profile-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                  End Year
                </label>
                <input
                  type="number"
                  placeholder="2024"
                  min={1950}
                  max={2030}
                  value={edu.endYear || ""}
                  onChange={(e) => updateEdu(edu.id, { endYear: parseInt(e.target.value) || 0 })}
                  className="profile-input"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addEdu}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
        style={{ border: "1.5px dashed var(--border2)", background: "transparent", color: "var(--text3)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}
      >
        + Add education
      </button>
    </div>
  );
}
