"use client";

import type { UserProfile } from "@/lib/types";

interface StepDef {
  label: string;
  required: boolean;
}

const steps: StepDef[] = [
  { label: "Basic Info", required: true },
  { label: "Skills & Languages", required: true },
  { label: "Work Experience", required: true },
  { label: "Education", required: true },
  { label: "Projects", required: true },
  { label: "Availability", required: true },
  { label: "Social Links", required: false },
];

// Simple completeness check per step
function isStepComplete(step: number, data: UserProfile): boolean {
  switch (step) {
    case 0:
      return !!(data.firstName && data.lastName && data.email && data.headline && data.location);
    case 1:
      return data.skills.length > 0;
    case 2:
      return data.experience.length > 0;
    case 3:
      return data.education.length > 0;
    case 4:
      return data.projects.length > 0;
    case 5:
      return !!data.availability.status;
    case 6:
      return true; // optional
    default:
      return false;
  }
}

interface ProfileStepNavProps {
  current: number;
  onGoTo: (step: number) => void;
  profile: UserProfile;
}

export default function ProfileStepNav({ current, onGoTo, profile }: ProfileStepNavProps) {
  const pct = Math.round(((current + 1) / steps.length) * 100);

  return (
    <aside
      className="w-[260px] shrink-0 h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 pt-7 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h2 className="font-display font-extrabold text-[15px] tracking-tight" style={{ color: "var(--text)" }}>
          Umurava Talent Profile
        </h2>
        <p className="text-[12px] mt-1" style={{ color: "var(--text3)" }}>
          Build your professional profile
        </p>
        {/* Progress bar */}
        <div
          className="mt-4 h-[3px] rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-400 ease-out"
            style={{ width: `${pct}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {/* Step list */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {steps.map((s, i) => {
          const active = i === current;
          const done = i !== current && isStepComplete(i, profile);

          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className="flex items-center gap-3 rounded-xl text-left transition-all duration-150 w-full"
              style={{
                padding: "10px 12px",
                background: active
                  ? "var(--accent-dim)"
                  : "transparent",
              }}
            >
              {/* Step number circle */}
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 transition-all"
                style={{
                  background: done
                    ? "var(--green)"
                    : active
                      ? "var(--accent)"
                      : "var(--surface2)",
                  border: done || active ? "none" : "1px solid var(--border)",
                  color: done || active ? "#fff" : "var(--text3)",
                }}
              >
                {done ? "✓" : i + 1}
              </span>

              {/* Label */}
              <span
                className="text-[13px]"
                style={{
                  color: active
                    ? "var(--accent)"
                    : done
                      ? "var(--green)"
                      : "var(--text2)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {s.label}
              </span>

              {/* Required badge */}
              {s.required && (
                <span
                  className="text-[10px] font-medium ml-auto"
                  style={{ color: "var(--red)" }}
                >
                  REQ
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
