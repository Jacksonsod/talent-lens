// ─────────────────────────────────────────────
// Core domain types for TalentAI
// ─────────────────────────────────────────────

export type JobStatus = "draft" | "active" | "closed" | "screened";
export type WorkType = "remote" | "onsite" | "hybrid";
export type ContractType = "full-time" | "part-time" | "contract";

export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  workType: WorkType;
  contractType: ContractType;
  experienceRequired: string;
  skills: string[];
  description: string;
  status: JobStatus;
  applicantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  department: string;
  location: string;
  workType: WorkType;
  contractType: ContractType;
  experienceRequired: string;
  skills: string[];
  description: string;
}

// ─── Applicant ────────────────────────────────

export type ApplicantSource = "umurava" | "csv" | "pdf" | "manual";

export interface Applicant {
  _id: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  education: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  source: ApplicantSource;
  rawData?: Record<string, unknown>;
  createdAt: string;
}

// ─── Screening / AI Results ───────────────────

export type Recommendation = "Strongly recommend" | "Recommend" | "Consider" | "Low match";

export interface ScoreBreakdown {
  skills: number;       // 0–100
  experience: number;   // 0–100
  education: number;    // 0–100
  relevance: number;    // 0–100
}

export interface SkillTag {
  skill: string;
  type: "match" | "gap" | "neutral";
}

export interface ScreeningResult {
  _id: string;
  jobId: string;
  applicantId: string;
  applicant: Applicant;
  rank: number;
  totalScore: number;             // weighted 0–100
  scoreBreakdown: ScoreBreakdown;
  skillTags: SkillTag[];
  strengths: string;
  gaps: string;
  recommendation: Recommendation;
  aiModel: string;
  createdAt: string;
}

export interface ShortlistResponse {
  jobId: string;
  job: Job;
  results: ScreeningResult[];
  totalScreened: number;
  shortlistCount: number;
  averageScore: number;
  topScore: number;
  screenedAt: string;
}

// ─── Upload ───────────────────────────────────

export interface ParsedApplicantRow {
  name: string;
  email: string;
  currentRole: string;
  yearsOfExperience: number | string;
  skills: string;
  education?: string;
  linkedinUrl?: string;
}

// ─── Redux State ──────────────────────────────

export interface JobsState {
  items: Job[];
  selected: Job | null;
  loading: boolean;
  error: string | null;
}

export interface ApplicantsState {
  items: Applicant[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  parsedPreview: ParsedApplicantRow[];
}

export interface ScreeningState {
  results: Record<string, ShortlistResponse>;  // keyed by jobId
  isScreening: boolean;
  screeningJobId: string | null;
  progress: number;
  log: string[];
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: "dark" | "light";
}

export interface RootState {
  jobs: JobsState;
  applicants: ApplicantsState;
  screening: ScreeningState;
  ui: UIState;
}
