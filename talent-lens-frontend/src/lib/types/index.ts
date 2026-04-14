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
  phone: string;
  currentRole: string;
  headline: string;
  location: string;
  bio: string;
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

// ─── USER PROFILE ────────────────────────────
export interface ProfileSkill {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience: number;
}

export interface ProfileLanguage {
  id: string;
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface ProfileExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface ProfileEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

export interface ProfileProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}

export interface ProfileCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
}

export interface ProfileAvailability {
  status: "available" | "open" | "not";
  type: "Full-time" | "Part-time" | "Contract";
  startDate: string;
}

export interface ProfileSocialLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  location: string;
  umuravaProfileId: string;
  skills: ProfileSkill[];
  languages: ProfileLanguage[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  projects: ProfileProject[];
  certifications: ProfileCertification[];
  availability: ProfileAvailability;
  socialLinks: ProfileSocialLinks;
}

export interface ProfileState {
  data: UserProfile;
  loaded: boolean;
  saving: boolean;
}

export interface RootState {
  jobs: JobsState;
  applicants: ApplicantsState;
  screening: ScreeningState;
  ui: UIState;
  profile: ProfileState;
}
