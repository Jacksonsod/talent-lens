"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks/redux";
import { createJob } from "@/lib/slices/jobsSlice";
import { runScreening } from "@/lib/slices/screeningSlice";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function JobForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    experienceRequired: "",
    description: "Standard job description.",
  });

  const [skills, setSkills] = useState<string[]>(["react"]);
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const s = skillInput.trim().replace(",", "");
      if (s && !skills.includes(s)) {
        setSkills([...skills, s]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((skill) => skill !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.department) {
      return toast.error("Please fill in the job title and department.");
    }

    setLoading(true);
    try {
      const job = await dispatch(
        createJob({
          ...formData,
          skills,
          workType: "remote", // Defaulting for simple mock
          contractType: "full-time",
        })
      ).unwrap();

      toast.success("Job created successfully!");
      // Automatically trigger the AI screening simulation
      dispatch(runScreening(job._id));
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
            label="Job Title"
            placeholder="e.g. Senior Full Stack Engineer"
            value={formData.title}
            onChange={(v) => setFormData({ ...formData, title: v })}
          />
          <FormGroup
            label="Department"
            placeholder="e.g. Engineering"
            value={formData.department}
            onChange={(v) => setFormData({ ...formData, department: v })}
          />
          <FormGroup
            label="Location"
            placeholder="e.g. Kigali / Remote"
            value={formData.location}
            onChange={(v) => setFormData({ ...formData, location: v })}
          />
          <FormGroup
            label="Experience Required"
            placeholder="e.g. 3-5 years"
            value={formData.experienceRequired}
            onChange={(v) => setFormData({ ...formData, experienceRequired: v })}
          />
        </div>
      </div>

      {/* Required Skills Card */}
      <div
        className="rounded-2xl p-7"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="font-display font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
          Required Skills
        </div>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text3)" }}>
          Add Skills Manually
        </div>
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-lg border transition-all duration-200"
          style={{
            background: "var(--bg)",
            borderColor: "var(--border)",
          }}
        >
          {skills.map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-md text-[13px] flex items-center gap-1.5"
              style={{
                background: "var(--surface3)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              {s}
              <X
                size={14}
                className="cursor-pointer text-[var(--text3)] hover:text-red-400"
                onClick={() => removeSkill(s)}
              />
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
          {loading ? "Creating..." : "Create Job & Start Screening"}
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
      <label
        className="text-[10px] font-bold tracking-widest uppercase"
        style={{ color: "var(--text3)" }}
      >
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border focus:border-[var(--accent)] outline-none transition-all duration-200"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}
