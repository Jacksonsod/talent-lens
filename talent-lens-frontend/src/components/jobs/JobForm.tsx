"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks/redux";
import { createJob } from "@/lib/slices/jobsSlice";
import toast from "react-hot-toast";
import { CreateJobInput, JobStatus } from "@/lib/types";
import { Sparkles, X, Target, Zap, ClipboardList, Trophy } from "lucide-react";

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'full stack': ['React', 'Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'REST API', 'Git', 'Docker'],
  'frontend': ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Redux', 'Figma', 'Jest', 'Vite'],
  'backend': ['Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'REST API', 'Docker', 'Auth/JWT', 'Redis'],
  'ai': ['Python', 'PyTorch', 'TensorFlow', 'Gemini API', 'LLM', 'Prompt Engineering', 'RAG', 'FastAPI'],
  'ml': ['Python', 'scikit-learn', 'PyTorch', 'Pandas', 'NumPy', 'MLflow', 'Data Pipelines', 'SQL'],
  'designer': ['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing', 'Adobe XD'],
  'devops': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux', 'GitHub Actions', 'Monitoring'],
  'qa': ['Selenium', 'Cypress', 'Jest', 'Test Planning', 'Bug Tracking', 'Postman', 'Automation', 'JIRA'],
  'data': ['SQL', 'Python', 'Tableau', 'Power BI', 'ETL', 'Spark', 'Airflow', 'Data Modeling'],
};

export default function JobForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

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

  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showChips, setShowChips] = useState(false);

  // Derived state for Readiness Score
  const descWords = formData.description.trim().split(/\s+/).filter(Boolean).length;
  
  const f1 = formData.roleTitle.length > 3 ? 100 : 0;
  const f2 = Math.min(100, Math.round((descWords / 150) * 100));
  const f3 = Math.min(100, Math.round((requiredSkills.length / 6) * 100));
  const f4 = Math.min(100, Math.round((requirements.length / 3) * 100));
  const f5 = formData.experienceLevel ? 100 : 0;

  const score = Math.round(f1 * 0.25 + f2 * 0.3 + f3 * 0.25 + f4 * 0.1 + f5 * 0.1);

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600 bg-green-500";
    if (score >= 50) return "text-amber-600 bg-amber-500";
    if (score > 0) return "text-blue-600 bg-blue-500";
    return "text-[var(--text3)] bg-[var(--surface3)]";
  };
  const [textColor, bgColor] = getScoreColor().split(" ");

  useEffect(() => {
    const lower = formData.roleTitle.toLowerCase();
    let matched: string[] | null = null;
    for (const [key, arr] of Object.entries(SKILL_SUGGESTIONS)) {
      if (lower.includes(key)) {
        matched = arr;
        break;
      }
    }

    if (matched && formData.roleTitle.length > 4) {
      setCurrentSuggestions(matched);
    } else {
      setCurrentSuggestions([]);
      setShowChips(false);
    }
  }, [formData.roleTitle]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = skillInput.trim().replace(/,$/, "");
      if (val && !requiredSkills.includes(val)) {
        setRequiredSkills([...requiredSkills, val]);
      }
      setSkillInput("");
    }
  };

  const handleAddRequirement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = reqInput.trim().replace(/,$/, "");
      if (val && !requirements.includes(val)) {
        setRequirements([...requirements, val]);
      }
      setReqInput("");
    }
  };

  const addSuggestedSkill = (s: string) => {
    if (!requiredSkills.includes(s)) {
      setRequiredSkills([...requiredSkills, s]);
    }
  };

  const adjustShortlist = (delta: number) => {
    const newSize = Math.max(5, Math.min(50, formData.shortlistSize + delta));
    setFormData({ ...formData, shortlistSize: newSize });
  };

  const handleSubmit = async () => {
    if (!formData.roleTitle) return toast.error("Please enter a role title.");
    if (requiredSkills.length === 0) return toast.error("Please add at least one required skill.");

    setLoading(true);
    try {
      const payload: CreateJobInput = {
        roleTitle: formData.roleTitle,
        description: formData.description || "Required job description.",
        experienceLevel: formData.experienceLevel || "Mid-level",
        shortlistSize: formData.shortlistSize,
        status: "Open", // Always create as Open for now based on UI
        requiredSkills,
        requirements,
      };

      const res = await dispatch(createJob(payload)).unwrap();
      toast.success("Job created successfully!");
      router.push(`/jobs/${res._id}/applicants`);
    } catch (err) {
      toast.error("Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto animate-fade-up">
      
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-[26px] tracking-tight text-[var(--text)] mb-1.5">
            Create New Job
          </h1>
          <p className="text-[13.5px] text-[var(--text3)] leading-relaxed max-w-[500px]">
            Define the role clearly — the more detail you provide, the more accurate Gemini's candidate scoring will be.
          </p>
        </div>
        <div className="text-right mt-1 w-[280px]">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">
            <span>AI Readiness</span>
            <span className={`font-display text-[13px] ${textColor}`}>{score}%</span>
          </div>
          <div className="h-[5px] bg-[var(--surface3)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${bgColor}`} 
              style={{ width: `${score}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[22px]">
        
        {/* LEFT COLUMN: FORM SECTIONS */}
        <div className="flex flex-col gap-4">
          
          {/* SECTION 1: Role Details */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 transition-colors focus-within:border-blue-400">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Target size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-[15px] text-[var(--text)]">Role Details</h2>
                <p className="text-[11.5px] text-[var(--text3)] mt-0.5">Core information Gemini uses to understand what you're hiring for</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Role Title<span className="text-red-500 ml-0.5">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Full Stack Engineer" 
                  value={formData.roleTitle}
                  onChange={e => setFormData({...formData, roleTitle: e.target.value})}
                  className="bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text)] outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <span className="text-[11px] text-[var(--text3)] mt-0.5">Be specific — "Senior React Engineer" outperforms "Developer"</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Experience Level<span className="text-red-500 ml-0.5">*</span></label>
                <select 
                  value={formData.experienceLevel}
                  onChange={e => setFormData({...formData, experienceLevel: e.target.value})}
                  className="bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text)] outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239299a8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Select level...</option>
                  <option value="Junior">Junior (0–2 years)</option>
                  <option value="Mid-level">Mid-level (2–4 years)</option>
                  <option value="Senior">Senior (4–7 years)</option>
                  <option value="Lead">Lead (7+ years)</option>
                  <option value="Principal">Principal / Staff</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Job Description<span className="text-red-500 ml-0.5">*</span></label>
              <textarea 
                placeholder="Describe the role, team context, key responsibilities, and what success looks like in the first 90 days..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text)] outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[96px] resize-y leading-[1.65]"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-[var(--text3)]">Aim for 150+ words. Richer descriptions improve AI scoring accuracy.</span>
                <span className={`text-[10.5px] ${descWords > 120 ? 'text-green-600' : 'text-[var(--text3)]'}`}>{descWords} / 500</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Required Skills */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 transition-colors focus-within:border-blue-400">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-[15px] text-[var(--text)]">Required Skills</h2>
                <p className="text-[11.5px] text-[var(--text3)] mt-0.5">Gemini weights candidates by how well their skills match these — add as many as relevant</p>
              </div>
            </div>

            {/* AI Suggest Banner */}
            {currentSuggestions.length > 0 && !showChips && (
              <div 
                className="flex items-center gap-2.5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-[1.5px] border-blue-200/50 rounded-[10px] p-3 mb-3.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all animate-fade-up"
                onClick={() => setShowChips(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-blue-700">Gemini detected skills for this role</div>
                  <div className="text-[11px] text-[var(--text3)]">Click to see suggestions based on your job title</div>
                </div>
                <div className="text-[12px] font-bold text-blue-600">Add all →</div>
              </div>
            )}

            {/* Suggested Chips */}
            {showChips && (
              <div className="flex flex-wrap gap-1.5 mb-3.5 animate-fade-up">
                {currentSuggestions.map(s => {
                  const added = requiredSkills.includes(s);
                  return (
                    <button 
                      key={s}
                      onClick={() => addSuggestedSkill(s)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors border-[1.5px] ${added ? 'bg-blue-600 text-white border-blue-600 opacity-50 cursor-default' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Add Skills<span className="text-red-500 ml-0.5">*</span></label>
              <div className="bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] p-2.5 min-h-[48px] flex flex-wrap gap-1.5 items-center cursor-text transition-all focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                {requiredSkills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[12px] font-medium flex items-center gap-1 animate-fade-up">
                    {skill}
                    <X size={12} className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => setRequiredSkills(requiredSkills.filter(s => s !== skill))} />
                  </span>
                ))}
                <input 
                  type="text" 
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type a skill, press Enter or comma..." 
                  className="flex-1 min-w-[100px] bg-transparent outline-none text-[13px] text-[var(--text)] placeholder-[var(--text3)]"
                />
              </div>
              <span className="text-[11px] text-[var(--text3)] mt-0.5">e.g. React, Node.js, TypeScript, MongoDB — press Enter after each</span>
            </div>
          </div>

          {/* SECTION 3: Requirements */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 transition-colors focus-within:border-blue-400">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardList size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-[15px] text-[var(--text)]">General Requirements</h2>
                <p className="text-[11.5px] text-[var(--text3)] mt-0.5">Non-technical expectations — education, soft skills, certifications, travel requirements</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Add Requirements</label>
              <div className="bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] p-2.5 min-h-[48px] flex flex-wrap gap-1.5 items-center cursor-text transition-all focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                {requirements.map(req => (
                  <span key={req} className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[12px] font-medium flex items-center gap-1 animate-fade-up">
                    {req}
                    <X size={12} className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => setRequirements(requirements.filter(r => r !== req))} />
                  </span>
                ))}
                <input 
                  type="text" 
                  value={reqInput}
                  onChange={e => setReqInput(e.target.value)}
                  onKeyDown={handleAddRequirement}
                  placeholder="e.g. Bachelor's degree, Agile, Strong communicator..." 
                  className="flex-1 min-w-[100px] bg-transparent outline-none text-[13px] text-[var(--text)] placeholder-[var(--text3)]"
                />
              </div>
              <span className="text-[11px] text-[var(--text3)] mt-0.5">Press Enter or comma to add each requirement as a tag</span>
            </div>
          </div>

          {/* SECTION 4: Shortlist Settings */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 transition-colors focus-within:border-blue-400">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-[15px] text-[var(--text)]">Shortlist Settings</h2>
                <p className="text-[11.5px] text-[var(--text3)] mt-0.5">How many top candidates should Gemini return after screening?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-[var(--text2)] uppercase tracking-wider">Shortlist Size<span className="text-red-500 ml-0.5">*</span></label>
                <div className="flex items-center bg-[var(--surface2)] border-[1.5px] border-[var(--border)] rounded-[10px] w-[140px] overflow-hidden">
                  <button type="button" className="w-10 h-10 flex items-center justify-center text-lg text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors" onClick={() => adjustShortlist(-5)}>−</button>
                  <div className="flex-1 text-center font-display font-bold text-[16px]">{formData.shortlistSize}</div>
                  <button type="button" className="w-10 h-10 flex items-center justify-center text-lg text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors" onClick={() => adjustShortlist(5)}>+</button>
                </div>
                <span className="text-[11px] text-[var(--text3)] mt-0.5">Gemini returns top <span className="font-bold">{formData.shortlistSize}</span> candidates</span>
              </div>

              <div className="flex flex-col justify-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({...formData, shortlistSize: 10})}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.shortlistSize === 10 ? 'border-blue-600' : 'border-gray-300'}`}>
                    {formData.shortlistSize === 10 && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-[13px] text-[var(--text2)]">Top 10 <span className="text-[11px] text-[var(--text3)] ml-1">— Standard</span></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({...formData, shortlistSize: 20})}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.shortlistSize === 20 ? 'border-blue-600' : 'border-gray-300'}`}>
                    {formData.shortlistSize === 20 && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-[13px] text-[var(--text2)]">Top 20 <span className="text-[11px] text-[var(--text3)] ml-1">— Competitive roles</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center gap-2.5 mt-2">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
            >
              {loading ? "Creating..." : (
                <>
                  <Sparkles size={16} /> Create Job & Start Screening
                </>
              )}
            </button>
            <button className="h-[48px] px-6 bg-transparent border-[1.5px] border-[var(--border2)] rounded-xl text-[13.5px] font-semibold text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors whitespace-nowrap">
              Save as Draft
            </button>
            <button className="h-[48px] px-6 bg-transparent border-[1.5px] border-red-200 text-red-600 rounded-xl text-[13.5px] font-semibold hover:bg-red-50 transition-colors whitespace-nowrap" onClick={() => router.push('/jobs')}>
              Cancel
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: PANELS */}
        <div className="flex flex-col gap-4">
          
          {/* AI Readiness Score Panel */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px_20px]">
            <h3 className="font-display font-bold text-[13px] flex items-center gap-2 mb-3.5">
              <span className="text-[14px]">✦</span> AI Readiness Score
            </h3>
            <div className="text-center py-2 pb-4">
              <div className={`font-display font-extrabold text-[44px] leading-none tracking-[-2px] transition-colors duration-500 ${textColor}`}>
                {score}
              </div>
              <div className="text-[12px] text-[var(--text3)] mt-1 font-medium">
                {score >= 80 ? '🎯 Excellent — ready for screening' :
                 score >= 60 ? '⚡ Good — add more detail to improve' :
                 score >= 30 ? '📝 Getting there — keep filling in' :
                 'Fill in the form to improve'}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              <ReadinessFactor icon="🎯" iconBg="bg-blue-50" label="Role title" score={f1} color="bg-blue-600" />
              <ReadinessFactor icon="📝" iconBg="bg-amber-50" label="Description" score={f2} color="bg-amber-500" />
              <ReadinessFactor icon="⚡" iconBg="bg-purple-50" label="Skills added" score={f3} color="bg-purple-500" />
              <ReadinessFactor icon="📋" iconBg="bg-emerald-50" label="Requirements" score={f4} color="bg-emerald-500" />
              <ReadinessFactor icon="🎓" iconBg="bg-blue-50" label="Exp. level" score={f5} color="bg-blue-600" />
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px_20px]">
            <h3 className="font-display font-bold text-[13px] flex items-center gap-2 mb-4">
              <span className="text-[14px]">👁</span> Gemini Will See
            </h3>
            
            <PreviewField label="Role" empty={!formData.roleTitle}>
              {formData.roleTitle || "Not set"}
            </PreviewField>
            
            <PreviewField label="Experience" empty={!formData.experienceLevel}>
              {formData.experienceLevel || "Not set"}
            </PreviewField>

            <div className="mb-2.5">
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Skills to match</div>
              {requiredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                  {requiredSkills.map(s => <span key={s} className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s}</span>)}
                </div>
              ) : (
                <div className="text-[12px] text-[var(--text3)] italic">None added yet</div>
              )}
            </div>

            <div className="mb-2.5">
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Requirements</div>
              {requirements.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                  {requirements.map(s => <span key={s} className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s}</span>)}
                </div>
              ) : (
                <div className="text-[12px] text-[var(--text3)] italic">None added yet</div>
              )}
            </div>

            <div className="mb-0">
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-1">Shortlist size</div>
              <div className="text-[12.5px] text-[var(--text)] font-medium">{formData.shortlistSize} candidates</div>
            </div>
          </div>

          {/* Tips Panel */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px_20px]">
            <h3 className="font-display font-bold text-[13px] flex items-center gap-2 mb-3.5">
              <span className="text-[14px]">💡</span> Screening Tips
            </h3>
            <div className="flex flex-col gap-3">
              <TipItem dot="bg-blue-600">Add <strong>5–10 specific skills</strong> — Gemini weights each one against candidate profiles</TipItem>
              <TipItem dot="bg-purple-500">Descriptions over <strong>150 words</strong> produce 40% more accurate shortlists</TipItem>
              <TipItem dot="bg-emerald-500">Use <strong>Top 20</strong> for competitive roles with many qualified applicants</TipItem>
              <TipItem dot="bg-amber-500">Gemini explains <strong>every score</strong> — strengths, gaps, and final recommendation</TipItem>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ReadinessFactor({ icon, iconBg, label, score, color }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] shrink-0 ${iconBg}`}>{icon}</div>
      <div className="text-[12px] text-[var(--text2)] flex-1">{label}</div>
      <div className="w-[60px] h-1 bg-[var(--surface3)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${color}`} style={{ width: `${score}%` }} />
      </div>
      <div className="text-[14px] ml-0.5 text-gray-300 w-4 text-center">
        {score === 100 ? <span className="text-green-500">✅</span> : score > 0 ? <span className="text-amber-500">⏳</span> : '○'}
      </div>
    </div>
  );
}

function PreviewField({ label, children, empty }: any) {
  return (
    <div className="mb-2.5">
      <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-[12.5px] leading-[1.5] min-h-[16px] ${empty ? 'text-[var(--text3)] italic' : 'text-[var(--text)] font-medium'}`}>
        {children}
      </div>
    </div>
  );
}

function TipItem({ dot, children }: any) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dot}`} />
      <div className="text-[12px] text-[var(--text2)] leading-[1.55]">{children}</div>
    </div>
  );
}
