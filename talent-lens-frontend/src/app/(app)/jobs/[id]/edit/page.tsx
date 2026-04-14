"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobById, updateJob } from "@/lib/slices/jobsSlice";
import { CreateJobInput, JobStatus } from "@/lib/types";
import { X, Sparkles, ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";

const SUGGESTIONS: Record<string, string[]> = {
  "Full Stack": ["React", "Node.js", "TypeScript", "Next.js", "MongoDB"],
  "Frontend":   ["React", "CSS", "TypeScript", "Tailwind", "Next.js"],
  "Backend":    ["Node.js", "PostgreSQL", "Redis", "Docker", "AWS"],
  "Designer":   ["Figma", "UX Research", "Prototyping", "UI Design"],
  "Mobile":     ["React Native", "Swift", "Kotlin", "Firebase"],
};

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const job = useAppSelector((s) => s.jobs.items.find((j) => j._id === id) || s.jobs.selected);
  const jobsLoading = useAppSelector((s) => s.jobs.loading);

  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [formData, setFormData] = useState({
    roleTitle: "",
    description: "",
    experienceLevel: "",
    shortlistSize: 10,
    status: "Draft" as JobStatus,
  });
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");

  // Fetch job if not in redux state yet
  useEffect(() => {
    if (!job) dispatch(fetchJobById(id));
  }, [id, dispatch, job]);

  // Pre-populate form once job is available
  useEffect(() => {
    if (job && !hydrated) {
      setFormData({
        roleTitle: job.roleTitle,
        description: job.description,
        experienceLevel: job.experienceLevel,
        shortlistSize: job.shortlistSize,
        status: job.status,
      });
      setRequiredSkills(job.requiredSkills ?? []);
      setRequirements(job.requirements ?? []);
      setHydrated(true);
    }
  }, [job, hydrated]);

  const handleSuggestSkills = () => {
    if (!formData.roleTitle) return toast.error("Enter a job title first!");
    setSuggesting(true);
    setTimeout(() => {
      const match = Object.keys(SUGGESTIONS).find((k) =>
        formData.roleTitle.toLowerCase().includes(k.toLowerCase())
      );
      const newSkills = match ? SUGGESTIONS[match] : ["Communication", "Problem Solving", "Teamwork"];
      setRequiredSkills(Array.from(new Set([...requiredSkills, ...newSkills])));
      setSuggesting(false);
      toast.success("AI suggested skills added!", { icon: "✨" });
    }, 900);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleTitle || !formData.experienceLevel) {
      return toast.error("Please fill in the job title and experience level.");
    }
    setLoading(true);
    try {
      const payload: Partial<CreateJobInput> = {
        roleTitle: formData.roleTitle,
        description: formData.description || "Required job description.",
        experienceLevel: formData.experienceLevel,
        shortlistSize: formData.shortlistSize,
        status: formData.status,
        requiredSkills,
        requirements,
      };
      await dispatch(updateJob({ id, data: payload })).unwrap();
      toast.success("Job updated successfully!");
      router.push("/jobs");
    } catch {
      toast.error("Failed to update job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (jobsLoading && !job) return <LoadingSpinner />;
  if (!job && hydrated === false && !jobsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[var(--text3)]">Job not found.</p>
        <Link href="/jobs" className="btn btn-ghost">← Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="stagger space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--text3)" }}>
            <Link href="/jobs" className="hover:text-[var(--text2)] transition-colors flex items-center gap-1">
              <ArrowLeft size={13} /> All Jobs
            </Link>
            <span>/</span>
            <span style={{ color: "var(--text2)" }}>Edit</span>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: "var(--text)" }}>
            Edit Job Post
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
            Update the details for <span className="font-semibold" style={{ color: "var(--text2)" }}>{formData.roleTitle || "this job"}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details */}
        <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
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
                <option value="Screening">Screening</option>
                <option value="Closed">Closed</option>
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
              className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200 min-h-[120px]"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>

        {/* General Requirements */}
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
                <X size={14} className="cursor-pointer text-[var(--text3)] hover:text-red-400" onClick={() => setRequirements(requirements.filter((r) => r !== req))} />
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

        {/* Required Skills */}
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
                <X size={14} className="cursor-pointer text-[var(--text3)] hover:text-red-400" onClick={() => setRequiredSkills(requiredSkills.filter((sk) => sk !== s))} />
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

        {/* Footer actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="btn btn-primary h-12 flex-1 max-w-[480px] text-base flex items-center justify-center gap-2"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Saving changes..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-ghost h-12 px-8"
            onClick={() => router.push("/jobs")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FormGroup({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
