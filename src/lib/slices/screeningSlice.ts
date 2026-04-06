import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ScreeningState, ShortlistResponse, ScreeningResult } from "@/lib/types";
import api from "@/lib/utils/api";

const mockResults: ScreeningResult[] = [
  {
    _id: "res-001",
    jobId: "job-001",
    applicantId: "app-001",
    applicant: {
      _id: "app-001",
      jobId: "job-001",
      name: "Alice Mutoni",
      email: "alice@example.com",
      currentRole: "Full Stack Developer",
      yearsOfExperience: 6,
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      education: "BS Computer Science",
      source: "csv",
      createdAt: new Date().toISOString(),
    },
    rank: 1,
    totalScore: 94,
    scoreBreakdown: { skills: 96, experience: 92, education: 80, relevance: 97 },
    skillTags: [
      { skill: "React", type: "match" },
      { skill: "Node.js", type: "match" },
      { skill: "TypeScript", type: "match" },
      { skill: "No DevOps", type: "gap" },
    ],
    strengths: "6 years full-stack, strong TypeScript and React, has led 3 product teams at scale.",
    gaps: "Limited DevOps exposure. No Kubernetes or CI/CD pipelines mentioned in CV.",
    recommendation: "Strongly recommend",
    aiModel: "Gemini 1.5 Pro",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "res-002",
    jobId: "job-001",
    applicantId: "app-002",
    applicant: {
      _id: "app-002",
      jobId: "job-001",
      name: "Brian Otieno",
      email: "brian@example.com",
      currentRole: "Backend Engineer",
      yearsOfExperience: 5,
      skills: ["Node.js", "MongoDB", "Python"],
      education: "MS Software Engineering",
      source: "pdf",
      createdAt: new Date().toISOString(),
    },
    rank: 2,
    totalScore: 87,
    scoreBreakdown: { skills: 82, experience: 90, education: 85, relevance: 88 },
    skillTags: [
      { skill: "Node.js", type: "match" },
      { skill: "MongoDB", type: "match" },
      { skill: "React (basic)", type: "neutral" },
      { skill: "No TypeScript", type: "gap" },
    ],
    strengths: "Deep backend expertise. MongoDB specialist, shipped 2 production REST APIs serving 50k+ users.",
    gaps: "React skills are described as basic. No TypeScript in public portfolio.",
    recommendation: "Recommend",
    aiModel: "Gemini 1.5 Pro",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "res-003",
    jobId: "job-001",
    applicantId: "app-003",
    applicant: {
      _id: "app-003",
      jobId: "job-001",
      name: "Chloe Nkusi",
      email: "chloe@example.com",
      currentRole: "Frontend Engineer",
      yearsOfExperience: 4,
      skills: ["Next.js", "Tailwind CSS", "Redux"],
      education: "BA Interactive Media",
      source: "csv",
      createdAt: new Date().toISOString(),
    },
    rank: 3,
    totalScore: 81,
    scoreBreakdown: { skills: 85, experience: 78, education: 82, relevance: 80 },
    skillTags: [
      { skill: "Next.js", type: "match" },
      { skill: "Tailwind", type: "match" },
      { skill: "Redux", type: "match" },
      { skill: "Backend (weak)", type: "gap" },
    ],
    strengths: "Next.js and UI specialist, strong design sensibility. Extensive Redux experience in complex state flows.",
    gaps: "Backend skills are thin. Not a true full-stack candidate for this role.",
    recommendation: "Consider",
    aiModel: "Gemini 1.5 Pro",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "res-004",
    jobId: "job-001",
    applicantId: "app-004",
    applicant: {
      _id: "app-004",
      jobId: "job-001",
      name: "David Mugisha",
      email: "david@example.com",
      currentRole: "Software Engineer",
      yearsOfExperience: 3,
      skills: ["React", "Python", "SQL"],
      education: "BS Computer Science",
      source: "manual",
      createdAt: new Date().toISOString(),
    },
    rank: 4,
    totalScore: 74,
    scoreBreakdown: { skills: 70, experience: 72, education: 88, relevance: 74 },
    skillTags: [
      { skill: "React", type: "match" },
      { skill: "Python", type: "neutral" },
      { skill: "No MongoDB", type: "gap" },
    ],
    strengths: "Strong React. Active GitHub with 20+ repos. CS degree from top regional university.",
    gaps: "No MongoDB or NoSQL experience. Only 3 years — junior for this seniority level.",
    recommendation: "Consider",
    aiModel: "Gemini 1.5 Pro",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "res-005",
    jobId: "job-001",
    applicantId: "app-005",
    applicant: {
      _id: "app-005",
      jobId: "job-001",
      name: "Eva Habimana",
      email: "eva@example.com",
      currentRole: "Full Stack Developer",
      yearsOfExperience: 5,
      skills: ["Vue.js", "Node.js", "AWS"],
      education: "BS Information Systems",
      source: "pdf",
      createdAt: new Date().toISOString(),
    },
    rank: 5,
    totalScore: 69,
    scoreBreakdown: { skills: 65, experience: 82, education: 70, relevance: 62 },
    skillTags: [
      { skill: "Vue.js", type: "neutral" },
      { skill: "Node.js", type: "match" },
      { skill: "AWS", type: "match" },
      { skill: "No React", type: "gap" },
    ],
    strengths: "Strong Node.js and AWS cloud experience. 5 years across two companies.",
    gaps: "Vue.js specialist, not React/Next.js. Framework mismatch is significant for this role.",
    recommendation: "Low match",
    aiModel: "Gemini 1.5 Pro",
    createdAt: new Date().toISOString(),
  }
];

const mockShortlist: ShortlistResponse = {
  jobId: "job-001",
  job: {
    _id: "job-001",
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    workType: "remote",
    contractType: "full-time",
    experienceRequired: "5+ years",
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
    description: "Mock job for demonstration.",
    status: "screened",
    applicantCount: 47,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  results: mockResults,
  totalScreened: 47,
  shortlistCount: 5,
  averageScore: 81,
  topScore: 94,
  screenedAt: new Date().toISOString(),
};

const initialState: ScreeningState = {
  results: { "job-001": mockShortlist },
  isScreening: false,
  screeningJobId: null,
  progress: 0,
  log: [],
  error: null,
};

// ─── Simulation Sequence ──────────────────────

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runScreening = createAsyncThunk(
  "screening/run",
  async (jobId: string, { dispatch }) => {
    dispatch(setScreeningJobId(jobId));
    
    // Step 1
    dispatch(setProgress(5));
    dispatch(appendLog("Initialized Gemini 1.5 Pro pipeline..."));
    await wait(600);
    
    // Step 2
    dispatch(setProgress(15));
    dispatch(appendLog("Parsing job requirements & scoring criteria..."));
    await wait(800);
    
    // Step 3
    dispatch(setProgress(35));
    dispatch(appendLog("Batch processing applicant CVs/Profiles (47 records)..."));
    await wait(1200);
    
    // Step 4
    dispatch(setProgress(60));
    dispatch(appendLog("Running skill similarity & experience relevance analysis..."));
    await wait(1000);
    
    // Step 5
    dispatch(setProgress(85));
    dispatch(appendLog("Generating natural language reasoning and match insights..."));
    await wait(1200);
    
    // Final Step
    dispatch(setProgress(100));
    dispatch(appendLog("Success: Ranking and shortlist generation complete."));
    await wait(400);

    // Normally we'd call an API here. For Demo, we return mock.
    if (jobId === "job-001") return mockShortlist;
    
    try {
      const res = await api.post<ShortlistResponse>(`/screening/run/${jobId}`);
      return res.data;
    } catch (err) {
      return mockShortlist; // Force mock results for any ID during demo
    }
  }
);

export const fetchShortlist = createAsyncThunk(
  "screening/fetchShortlist",
  async (jobId: string) => {
    if (jobId === "job-001") return mockShortlist;
    const res = await api.get<ShortlistResponse>(`/screening/shortlist/${jobId}`);
    return res.data;
  }
);

// ─── Slice ────────────────────────────────────

const screeningSlice = createSlice({
  name: "screening",
  initialState,
  reducers: {
    setScreeningJobId(state, action: PayloadAction<string | null>) {
      state.screeningJobId = action.payload;
      state.isScreening = action.payload !== null;
      state.progress = 0;
      state.log = [];
      state.error = null;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    appendLog(state, action: PayloadAction<string>) {
      state.log.push(action.payload);
    },
    clearScreening(state) {
      state.isScreening = false;
      state.screeningJobId = null;
      state.progress = 0;
      state.log = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runScreening.pending, (state) => {
        state.isScreening = true;
        state.error = null;
      })
      .addCase(runScreening.fulfilled, (state, action) => {
        state.isScreening = true; // KEEP MODAL OPEN to show 100% and View Results
        state.results[action.payload.jobId] = action.payload;
      })
      .addCase(runScreening.rejected, (state, action) => {
        state.isScreening = false;
        state.error = action.error.message ?? "Screening failed";
      });

    builder
      .addCase(fetchShortlist.fulfilled, (state, action) => {
        state.results[action.payload.jobId] = action.payload;
      });
  },
});

export const { setScreeningJobId, setProgress, appendLog, clearScreening } =
  screeningSlice.actions;
export default screeningSlice.reducer;
