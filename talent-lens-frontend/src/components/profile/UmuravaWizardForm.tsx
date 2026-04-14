"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks/redux";
import { addUmuravaApplicant } from "@/lib/slices/applicantsSlice";
import toast from "react-hot-toast";
import type {
  UserProfile,
  ProfileSkill,
  ProfileLanguage,
  ProfileExperience,
  ProfileEducation,
  ProfileProject,
  ProfileCertification,
  ProfileAvailability,
  ProfileSocialLinks,
} from "@/lib/types";

import BasicInfoStep from "./BasicInfoStep";
import SkillsStep from "./SkillsStep";
import ExperienceStep from "./ExperienceStep";
import EducationStep from "./EducationStep";
import ProjectsStep from "./ProjectsStep";
import AvailabilityStep from "./AvailabilityStep";
import SocialLinksStep from "./SocialLinksStep";

const TOTAL_STEPS = 7;

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  headline: "",
  bio: "",
  location: "",
  umuravaProfileId: "",
  skills: [],
  languages: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  availability: { status: "available", type: "Full-time", startDate: "" },
  socialLinks: { linkedin: "", github: "", portfolio: "" },
};

const stepLabels = [
  "Basic Info",
  "Skills & Languages",
  "Work Experience",
  "Education",
  "Projects",
  "Availability",
  "Social Links",
];

interface Props {
  jobId: string;
  onSuccess?: () => void;
  /** Controlled step — when provided, the wizard uses external step state */
  step?: number;
  onStepChange?: (step: number) => void;
  /** Hide the built-in top step indicator (use when parent renders sidebar nav) */
  hideTopNav?: boolean;
}

/**
 * Builds the JSON payload expected by POST /api/applicants/umurava
 * Maps the rich UserProfile form data to the backend Applicant schema.
 */
function buildPayload(jobId: string, data: UserProfile) {
  return {
    jobId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    headline: data.headline,
    bio: data.bio,
    location: data.location,
    skills: data.skills.map((s: ProfileSkill) => ({
      name: s.name,
      level: s.level,
      yearsOfExperience: s.yearsOfExperience,
    })),
    languages: data.languages.map((l: ProfileLanguage) => ({
      name: l.name,
      proficiency: l.proficiency,
    })),
    experience: data.experience.map((e: ProfileExperience) => ({
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      technologies: e.technologies,
      isCurrent: e.isCurrent,
    })),
    education: data.education.map((e: ProfileEducation) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      startYear: e.startYear,
      endYear: e.endYear,
    })),
    certifications: data.certifications.map((c: ProfileCertification) => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate,
    })),
    projects: data.projects.map((p: ProfileProject) => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies,
      role: p.role,
      link: p.link,
      startDate: p.startDate,
      endDate: p.endDate,
    })),
    availability: {
      status: data.availability.status,
      type: data.availability.type,
      startDate: data.availability.startDate,
    },
    socialLinks: {
      linkedin: data.socialLinks.linkedin,
      github: data.socialLinks.github,
      portfolio: data.socialLinks.portfolio,
    },
    // Derive top-level fields the backend needs
    yearsOfExperience: Math.max(
      ...data.skills.map((s: ProfileSkill) => s.yearsOfExperience || 0),
      0
    ),
    educationLevel:
      data.education.length > 0
        ? data.education[0].degree || "Other"
        : "Other",
    currentRole:
      data.experience.find((e: ProfileExperience) => e.isCurrent)?.role ||
      (data.experience.length > 0 ? data.experience[0].role : ""),
    profileData: {
      umuravaId: data.umuravaProfileId,
    },
  };
}

export default function UmuravaWizardForm({ jobId, onSuccess, step, onStepChange, hideTopNav }: Props) {
  const dispatch = useAppDispatch();
  const [internalStep, setInternalStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({ ...defaultProfile });
  const [submitting, setSubmitting] = useState(false);

  // Support both controlled and uncontrolled step
  const current = step !== undefined ? step : internalStep;
  const goTo = (s: number) => {
    if (onStepChange) onStepChange(s);
    else setInternalStep(s);
  };

  const handleChange = (fields: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
    if (current === TOTAL_STEPS - 1) {
      // Submit to backend
      if (!profile.firstName || !profile.lastName || !profile.email) {
        toast.error("First Name, Last Name and Email are required.");
        goTo(0);
        return;
      }

      setSubmitting(true);
      try {
        const payload = buildPayload(jobId, profile);
        const res = await dispatch(addUmuravaApplicant(payload));
        if (addUmuravaApplicant.fulfilled.match(res)) {
          toast.success("Applicant added successfully!");
          setProfile({ ...defaultProfile });
          goTo(0);
          onSuccess?.();
        } else {
          toast.error((res.payload as string) || "Failed to add applicant.");
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }
    goTo(Math.min(TOTAL_STEPS - 1, current + 1));
  };

  const handlePrev = () => {
    goTo(Math.max(0, current - 1));
  };

  const isLastStep = current === TOTAL_STEPS - 1;
  const pct = Math.round(((current + 1) / TOTAL_STEPS) * 100);

  return (
    <div>
      {/* Top step indicator — hidden when parent provides sidebar nav */}
      {!hideTopNav && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Step {current + 1} of {TOTAL_STEPS}
            </span>
            <select
              value={current}
              onChange={(e) => goTo(parseInt(e.target.value))}
              className="profile-input profile-select text-[13px] py-1.5 px-3 w-auto"
            >
              {stepLabels.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-400 ease-out"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </div>
        </div>
      )}

      {/* Render current step */}
      {current === 0 && <BasicInfoStep data={profile} onChange={handleChange} />}
      {current === 1 && <SkillsStep data={profile} onChange={handleChange} />}
      {current === 2 && <ExperienceStep data={profile} onChange={handleChange} />}
      {current === 3 && <EducationStep data={profile} onChange={handleChange} />}
      {current === 4 && <ProjectsStep data={profile} onChange={handleChange} />}
      {current === 5 && <AvailabilityStep data={profile} onChange={handleChange} />}
      {current === 6 && <SocialLinksStep data={profile} onChange={handleChange} />}

      {/* Footer nav */}
      <div
        className="flex items-center justify-between mt-6 pt-5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {current > 0 ? (
          <button onClick={handlePrev} className="btn btn-ghost">
            ← Back
          </button>
        ) : (
          <div />
        )}

        <span className="text-[12px] hidden sm:block" style={{ color: "var(--text3)" }}>
          Step {current + 1} of {TOTAL_STEPS}
        </span>

        <button
          onClick={handleNext}
          disabled={submitting}
          className={`btn ${isLastStep ? "" : "btn-primary"}`}
          style={
            isLastStep
              ? { background: "var(--green)", color: "#fff", borderColor: "var(--green)" }
              : undefined
          }
        >
          {submitting
            ? "Submitting..."
            : isLastStep
              ? "Submit Applicant"
              : "Continue →"}
        </button>
      </div>
    </div>
  );
}

