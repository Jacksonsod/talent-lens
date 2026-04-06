import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Applicant, ApplicantsState, ParsedApplicantRow } from "@/lib/types";
import api from "@/lib/utils/api";

const mockApplicants: Applicant[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
  }
];

const initialState: ApplicantsState = {
  items: mockApplicants,
  loading: false,
  error: null,
  uploadProgress: 0,
  parsedPreview: [],
};

// ─── Async Thunks ─────────────────────────────

export const fetchApplicants = createAsyncThunk(
  "applicants/fetchAll",
  async (jobId: string) => {
    if (jobId === "job-001") return mockApplicants;
    const res = await api.get<Applicant[]>(`/applicants/job/${jobId}`);
    return res.data;
  }
);

export const uploadCandidates = createAsyncThunk(
  "applicants/upload",
  async ({ jobId, files }: { jobId: string; files: File[] }) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await api.post<Applicant[]>(`/applicants/upload/${jobId}`, formData);
    return res.data;
  }
);

// ─── Slice ────────────────────────────────────

const applicantsSlice = createSlice({
  name: "applicants",
  initialState,
  reducers: {
    setParsedPreview(state, action: PayloadAction<ParsedApplicantRow[]>) {
      state.parsedPreview = action.payload;
    },
    clearApplicants(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicants.pending, (state) => { state.loading = true; })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch applicants";
      });

    builder
      .addCase(uploadCandidates.fulfilled, (state, action) => {
        state.items = [...state.items, ...action.payload];
      });
  },
});

export const { setParsedPreview, clearApplicants } = applicantsSlice.actions;
export default applicantsSlice.reducer;
