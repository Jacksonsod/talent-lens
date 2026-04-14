"use client";

import type { UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

export default function BasicInfoStep({ data, onChange }: Props) {
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
          Step 1 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Basic Information
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          Core identity fields for the talent profile. All required fields must be filled.
        </p>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="First Name" required>
          <input
            type="text"
            placeholder="e.g. Alice"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="profile-input"
          />
        </Field>
        <Field label="Last Name" required>
          <input
            type="text"
            placeholder="e.g. Mutoni"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="profile-input"
          />
        </Field>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Email" required>
          <input
            type="email"
            placeholder="alice@example.com"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="profile-input"
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            placeholder="+250 700 000 000"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="profile-input"
          />
        </Field>
      </div>

      {/* Headline */}
      <div className="mb-4">
        <Field label="Professional Headline" required>
          <input
            type="text"
            placeholder="e.g. Backend Engineer – Node.js & AI Systems"
            value={data.headline}
            onChange={(e) => onChange({ headline: e.target.value })}
            className="profile-input"
          />
        </Field>
      </div>

      {/* Location + Profile ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Location" required>
          <input
            type="text"
            placeholder="Kigali, Rwanda"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="profile-input"
          />
        </Field>
        <Field label="Umurava Profile ID">
          <input
            type="text"
            placeholder="umr_123"
            value={data.umuravaProfileId}
            onChange={(e) => onChange({ umuravaProfileId: e.target.value })}
            className="profile-input"
          />
        </Field>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <Field label="Bio">
          <textarea
            placeholder="A brief professional biography — key achievements, focus areas, what makes this candidate unique..."
            value={data.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            className="profile-input min-h-[100px] resize-y"
            rows={4}
          />
        </Field>
      </div>
    </div>
  );
}

/* ─── Reusable field wrapper ─── */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: "var(--red)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
