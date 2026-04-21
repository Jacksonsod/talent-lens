"use client";

import type { ProfileSocialLinks, UserProfile } from "@/lib/types";

interface Props {
  data: UserProfile;
  onChange: (fields: Partial<UserProfile>) => void;
}

export default function SocialLinksStep({ data, onChange }: Props) {
  const links = data.socialLinks;

  const setLink = (patch: Partial<ProfileSocialLinks>) => {
    onChange({ socialLinks: { ...links, ...patch } });
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{ color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(47,111,228,0.25)" }}
        >
          Step 7 of 7
        </span>
        <h2 className="font-display font-extrabold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
          Social Links
        </h2>
        <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text3)" }}>
          External profiles help verify skills and expand the AI&apos;s evaluation context.
        </p>
      </div>

      <div
        className="rounded-[14px] p-5"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
      >
        {/* LinkedIn */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
            style={{ background: "#dbeafe" }}
          >
            🔗
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              LinkedIn
            </label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={links.linkedin}
              onChange={(e) => setLink({ linkedin: e.target.value })}
              className="profile-input"
            />
          </div>
        </div>

        {/* GitHub */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
            style={{ background: "#f3f4f6" }}
          >
            ⚙️
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              GitHub
            </label>
            <input
              type="url"
              placeholder="https://github.com/username"
              value={links.github}
              onChange={(e) => setLink({ github: e.target.value })}
              className="profile-input"
            />
          </div>
        </div>

        {/* Portfolio */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
            style={{ background: "#ede9fe" }}
          >
            🌐
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Portfolio
            </label>
            <input
              type="url"
              placeholder="https://myportfolio.com"
              value={links.portfolio}
              onChange={(e) => setLink({ portfolio: e.target.value })}
              className="profile-input"
            />
          </div>
        </div>
      </div>

      {/* Submit summary */}
      <div
        className="rounded-[14px] p-5 mt-5"
        style={{
          background: "var(--green-dim)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <div className="font-semibold text-[14px] mb-2" style={{ color: "var(--green)" }}>
          Ready to save
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text2)" }}>
          Your talent profile will be saved locally and made available for screening via System AI.
          The richer the profile, the more accurate the match score and reasoning will be.
        </p>
      </div>
    </div>
  );
}
