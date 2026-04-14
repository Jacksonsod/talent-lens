"use client";

import type { ProfileAvailability, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

const CONTRACT_TYPES = ["Full-time", "Part-time", "Contract"] as const;

const statusOptions = [
  {
    key: "available" as const,
    label: "Available",
    sub: "Ready now",
    color: "var(--green)",
    dimBg: "var(--green-dim)",
  },
  {
    key: "open" as const,
    label: "Open to Opportunities",
    sub: "Considering offers",
    color: "var(--amber)",
    dimBg: "var(--amber-dim)",
  },
  {
    key: "not" as const,
    label: "Not Available",
    sub: "Not looking",
    color: "var(--red)",
    dimBg: "var(--red-dim)",
  },
];

export default function AvailabilityStep({ data, onChange }: Props) {
  const avail = data.availability;

  const setAvail = (patch: Partial<ProfileAvailability>) => {
    onChange({ availability: { ...avail, ...patch } });
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{ color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(47,111,228,0.25)" }}
        >
          Step 6 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Availability
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Current availability status. Affects AI matching for urgent roles.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {statusOptions.map((opt) => {
          const active = avail.status === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setAvail({ status: opt.key })}
              className="rounded-xl p-4 text-center transition-all cursor-pointer"
              style={{
                border: `1.5px solid ${active ? opt.color : "var(--border)"}`,
                background: active ? opt.dimBg : "transparent",
              }}
            >
              {/* Dot */}
              <div
                className="w-2.5 h-2.5 rounded-full mx-auto mb-2"
                style={{ background: opt.color }}
              />
              <div className="text-[12px] font-semibold" style={{ color: opt.color }}>
                {opt.label}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
                {opt.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Contract type + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Contract Type<span style={{ color: "var(--red)" }}>*</span>
          </label>
          <select
            value={avail.type}
            onChange={(e) => setAvail({ type: e.target.value as ProfileAvailability["type"] })}
            className="profile-input profile-select"
          >
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
            Available From (optional)
          </label>
          <input
            type="date"
            value={avail.startDate}
            onChange={(e) => setAvail({ startDate: e.target.value })}
            className="profile-input"
          />
        </div>
      </div>
    </div>
  );
}
