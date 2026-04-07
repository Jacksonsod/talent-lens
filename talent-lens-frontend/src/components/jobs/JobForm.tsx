"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks/redux";
import { createJob } from "@/lib/slices/jobsSlice";
import { X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { CreateJobInput, JobStatus } from "@/lib/types";

const SUGGESTIONS: Record<string, string[]> = {
  "Full Stack": ["React", "Node.js", "TypeScript", "Next.js", "MongoDB"],
  "Frontend": ["React", "CSS", "TypeScript", "Tailwind", "Next.js"],
  "Backend": ["Node.js", "PostgreSQL", "Redis", "Docker", "AWS"],
  "Designer": ["Figma", "UX Research", "Prototyping", "UI Design"],
  "Mobile": ["React Native", "Swift", "Kotlin", "Firebase"],
};

export default function JobForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const [formData, setFormData] = useState<{
    roleTitle: string;
    description: string;
    experienceLevel: string;
    shortlistSize: number;
    status: JobStatus;
  }>({
    roleTitle: "",
    experienceLevel: "",
    description: "",
    shortlistSize: 10,
    status: "Draft",
  });

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");

  const handleSuggestSkills = async () => {
    if (!formData.roleTitle) {
      return toast.error("Enter a job title first!");
    }
    setSuggesting(true);
    // Simulate AI suggestion
    setTimeout(() => {
      const match = Object.keys(SUGGESTIONS).find(k => 
        formData.roleTitle.toLowerCase().includes(k.toLowerCase())
      );
      const newSkills = match ? SUGGESTIONS[match] : ["Communication", "Problem Solving", "Teamwork"];
      
      setRequiredSkills(Array.from(new Set([...requiredSkills, ...newSkills])));
      setSuggesting(false);
      toast.success("AI suggested skills added!", { icon: "✨" });
    }, 1000);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const s = skillInput.trim().replace(",", "");
      if (s && !requiredSkills.includes(s)) {
        setRequiredSkills([...requiredSkills, s]);
        setSkillInput("");
      }
    }
  };

  const handleAddRequirement = (e: React.KeyboardEvent) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const s = reqInput.trim().replace(",", "");
      if (s && !requirements.includes(s)) {
        setRequirements([...requirements, s]);
        setReqInput("");
      }
    }
  };

  const removeSkill = (s: string) => {
    setRequiredSkills(requiredSkills.filter((skill) => skill !== s));
  };

  const removeReq = (s: string) => {
    setRequirements(requirements.filter((req) => req !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleTitle || !formData.experienceLevel) {
      return toast.error("Please fill in the job title and experience level.");
    }

    setLoading(true);
    try {
      const payload: CreateJobInput = {
        roleTitle: formData.roleTitle,
        description: formData.description || "Required job description.",
        experienceLevel: formData.experienceLevel,
        shortlistSize: formData.shortlistSize,
        status: formData.status,
        requiredSkills,
        requirements,
      };

      await dispatch(createJob(payload)).unwrap();

      toast.success("Job created!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="stagger space-y-6" onSubmit={handleSubmit}>
      {/* Job Details Card */}
      <div
        className="rounded-2xl p-7"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="font-display font-bold text-lg mb-6" style={{ color: "var(--text)" }}>
          Job Details
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup
            label="Role Title"
            placeholder="e.g. Senior Full Stack Engineer"
            value={formData.roleTitle}
            onChange={(v) => setFormData({ ...formData, roleTitle: v })}
          />
          <FormGroup
            label="Experience Level"
            placeholder="e.g. Mid-level"
            value={formData.experienceLevel}
            onChange={(v) => setFormData({ ...formData, experienceLevel: v })}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text3)" }}>
              Shortlist Size
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.shortlistSize}
              onChange={(e) => setFormData({ ...formData, shortlistSize: parseInt(e.target.value) || 10 })}
              className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text3)" }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
              className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200 appearance-none"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="Draft">Draft</option>
              <option value="Open">Open</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text3)" }}>
            Description
          </label>
          <textarea
            placeholder="Enter job description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200 min-h-[100px]"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>
      </div>

      {/* General Requirements Tag Field */}
      <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="font-display font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          General Requirements
        </div>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text3)" }}>
          Add Requirements
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border transition-all duration-200" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          {requirements.map((req) => (
            <span key={req} className="px-3 py-1 rounded-md text-[13px] flex items-center gap-1.5" style={{ background: "var(--surface3)", color: "var(--text)", border: "1px solid var(--border)" }}>
              {req}
              <X size={14} className="cursor-pointer text-[var(--text3)] hover:text-red-400" onClick={() => removeReq(req)} />
            </span>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[200px] bg-transparent outline-none text-[14px]"
            style={{ color: "var(--text)" }}
            placeholder="e.g. Master's Degree, Willing to travel"
            value={reqInput}
            onChange={(e) => setReqInput(e.target.value)}
            onKeyDown={handleAddRequirement}
          />
        </div>
      </div>

      {/* Required Skills Card */}
      <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>
            Required Skills
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all animate-pulse-ai"
            onClick={handleSuggestSkills}
            disabled={suggesting}
          >
            <Sparkles size={14} />
            {suggesting ? "AI Suggesting..." : "Suggest with Gemini"}
          </button>
        </div>

        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text3)" }}>
          Add Skills Manually
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border transition-all duration-200" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          {requiredSkills.map((s) => (
            <span key={s} className="px-3 py-1 rounded-md text-[13px] flex items-center gap-1.5" style={{ background: "var(--surface3)", color: "var(--text)", border: "1px solid var(--border)" }}>
              {s}
              <X size={14} className="cursor-pointer text-[var(--text3)] hover:text-red-400" onClick={() => removeSkill(s)} />
            </span>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[200px] bg-transparent outline-none text-[14px]"
            style={{ color: "var(--text)" }}
            placeholder="e.g. React, Node.js"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleAddSkill}
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="submit"
          className="btn btn-primary h-12 w-[80%] max-w-[600px] text-base"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Job Post"}
        </button>
        <button
          type="button"
          className="btn btn-ghost h-12 px-8"
          onClick={() => router.push("/dashboard")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormGroup({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text3)" }}>
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />
    </div>
  );
}
