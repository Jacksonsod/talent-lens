// ─────────────────────────────────────────────
// Core domain types for TalentAI - Backend Integrated version
// ─────────────────────────────────────────────

// ─── AUTH ────────────────────────────────────
export interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// ─── JOBS ────────────────────────────────────
export type JobStatus = "Draft" | "Open" | "Screening" | "Closed";

export interface Job {
  _id: string;
  roleTitle: string;           
  description: string;
  requirements: string[];      
  requiredSkills: string[];    
  experienceLevel: string;     
  shortlistSize: number;       
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  roleTitle: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  experienceLevel: string;
  shortlistSize: number;
  status: JobStatus;
}

// ─── APPLICANTS ──────────────────────────────
export type EducationLevel = "High School" | "Associate" | "Bachelor" | "Master" | "PhD" | "Other";

export interface Applicant {
  _id: string;
  jobId: string;
  firstName: string;           
  lastName: string;
  email: string;
  phone?: string;
  skills: string[];
  yearsOfExperience: number;
  educationLevel: EducationLevel;
  currentRole?: string;
  resumeUrl?: string;
  profileData?: {
    umuravaId?: string;
    rawResumeText?: string;
  };
  source: "umurava" | "external";
  createdAt: string;
}

// ─── SCREENING ───────────────────────────────
export type ScreeningStatus = "Pending" | "Completed" | "Failed";

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  relevance: number;
}

export interface ScreeningResult {
  _id: string;
  jobId: string;
  applicantId: string | Applicant;
  matchScore: number;          
  scoreBreakdown: ScoreBreakdown;
  strengths: string;
  gaps: string;
  reasoning: string;
  finalRecommendation: string; 
  status: ScreeningStatus;
  createdAt: string;
}

export interface ScreenAllResponse {
  jobId: string;
  totalScreened: number;
  totalFailed: number;
  results: ScreeningResult[];
}

// ─── REDUX STATES ────────────────────────────

export interface ParsedApplicantRow {
  firstName: string;
  lastName: string;
  email: string;
  currentRole: string;
  yearsOfExperience: number | string;
  skills: string;
  educationLevel: string;
}

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
  parsedPreview: ParsedApplicantRow[];
}

export interface ScreeningState {
  shortlists: Record<string, ScreeningResult[]>;
  isScreening: boolean;
  screeningJobId: string | null;
  progress: number;
  log: string[];
  screenAllResult: ScreenAllResponse | null;
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
