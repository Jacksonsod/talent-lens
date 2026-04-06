import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Job, JobsState, CreateJobInput } from "@/lib/types";
import api from "@/lib/utils/api";

const mockJobs: Job[] = [
  {
    _id: "job-001",
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    workType: "remote",
    contractType: "full-time",
    experienceRequired: "5+ years",
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
    description: "Senior Full Stack Engineer role.",
    status: "active",
    applicantCount: 47,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "job-002",
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Kigali",
    workType: "hybrid",
    contractType: "full-time",
    experienceRequired: "3+ years",
    skills: ["Python", "TensorFlow", "LLM", "Prompt Eng."],
    description: "AI/ML Engineer role.",
    status: "screened",
    applicantCount: 61,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "job-003",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    workType: "remote",
    contractType: "contract",
    experienceRequired: "4+ years",
    skills: ["Figma", "UX Research", "Prototyping"],
    description: "Product Designer role.",
    status: "active",
    applicantCount: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialState: JobsState = {
  items: mockJobs,
  selected: mockJobs[0],
  loading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async () => {
  try {
    const res = await api.get<Job[]>("/jobs");
    return res.data.length > 0 ? res.data : mockJobs;
  } catch (err) {
    return mockJobs;
  }
});

export const fetchJobById = createAsyncThunk(
  "jobs/fetchById",
  async (id: string) => {
    const mock = mockJobs.find(j => j._id === id);
    if (mock) return mock;
    const res = await api.get<Job>(`/jobs/${id}`);
    return res.data;
  }
);

export const createJob = createAsyncThunk(
  "jobs/create",
  async (input: CreateJobInput) => {
    const res = await api.post<Job>("/jobs", input);
    return res.data;
  }
);

export const updateJob = createAsyncThunk(
  "jobs/update",
  async ({ id, data }: { id: string; data: Partial<CreateJobInput> }) => {
    const res = await api.put<Job>(`/jobs/${id}`, data);
    return res.data;
  }
);

export const deleteJob = createAsyncThunk(
  "jobs/delete",
  async (id: string) => {
    await api.delete(`/jobs/${id}`);
    return id;
  }
);

// ─── Slice ────────────────────────────────────

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setSelectedJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch jobs";
      });

    builder
      .addCase(fetchJobById.pending, (state) => { state.loading = true; })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch job";
      });

    builder
      .addCase(createJob.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });

    builder
      .addCase(updateJob.fulfilled, (state, action) => {
        const idx = state.items.findIndex(j => j._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      });

    builder
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter(j => j._id !== action.payload);
      });
  },
});

export const { setSelectedJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
