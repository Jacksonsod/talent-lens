import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Job, JobsState, CreateJobInput, JobStatus } from "@/lib/types";
import api from "@/lib/api";

const initialState: JobsState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────

export const fetchJobs = createAsyncThunk(
  "jobs/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Job[]>("/api/jobs");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch jobs");
    }
  }
);

export const fetchJobById = createAsyncThunk(
  "jobs/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Job>(`/api/jobs/${id}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch job");
    }
  }
);

export const createJob = createAsyncThunk(
  "jobs/create",
  async (input: CreateJobInput, { rejectWithValue }) => {
    try {
      const response = await api.post<Job>("/api/jobs", input);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create job");
    }
  }
);

export const updateJob = createAsyncThunk(
  "jobs/update",
  async ({ id, data }: { id: string; data: Partial<CreateJobInput> }, { rejectWithValue }) => {
    try {
      const response = await api.put<Job>(`/api/jobs/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update job");
    }
  }
);

export const updateJobStatus = createAsyncThunk(
  "jobs/updateStatus",
  async ({ id, status }: { id: string; status: JobStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch<Job>(`/api/jobs/${id}/status`, { status });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update job status");
    }
  }
);

export const deleteJob = createAsyncThunk(
  "jobs/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/jobs/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete job");
    }
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
      // fetchJobs
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
        state.error = action.payload as string;
      })

      // fetchJobById
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // createJob
      .addCase(createJob.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // updateJob
      .addCase(updateJob.fulfilled, (state, action) => {
        const idx = state.items.findIndex(j => j._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      })

      // updateJobStatus
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(j => j._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      })

      // deleteJob
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter(j => j._id !== action.payload);
        if (state.selected?._id === action.payload) state.selected = null;
      });
  },
});

export const { setSelectedJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
