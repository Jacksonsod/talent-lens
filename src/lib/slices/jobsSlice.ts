import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Job, JobsState, CreateJobInput } from "@/lib/types";
import api from "@/lib/utils/api";

const initialState: JobsState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async () => {
  const res = await api.get<Job[]>("/jobs");
  return res.data;
});

export const fetchJobById = createAsyncThunk(
  "jobs/fetchById",
  async (id: string) => {
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
    // fetchJobs
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

    // fetchJobById
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

    // createJob
    builder
      .addCase(createJob.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });

    // updateJob
    builder
      .addCase(updateJob.fulfilled, (state, action) => {
        const idx = state.items.findIndex(j => j._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      });

    // deleteJob
    builder
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter(j => j._id !== action.payload);
      });
  },
});

export const { setSelectedJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
