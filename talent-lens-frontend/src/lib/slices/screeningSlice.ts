import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ScreeningResult, ScreeningState, ScreenAllResponse } from "@/lib/types";
import api from "@/lib/api";

const initialState: ScreeningState = {
  shortlists: {},
  isScreening: false,
  screeningJobId: null,
  progress: 0,
  log: [],
  screenAllResult: null,
  error: null,
};

// ─── Async Thunks ─────────────────────────────

export const screenAll = createAsyncThunk(
  "screening/screenAll",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ScreenAllResponse>(`/api/screening/job/${jobId}/screen-all`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to screen applicants");
    }
  }
);

export const fetchShortlist = createAsyncThunk(
  "screening/fetchShortlist",
  async (jobId: string, { rejectWithValue }) => {
    try {
      // Returns a wrapper object containing the results array
      const response = await api.get<{ jobId: string, results: ScreeningResult[] }>(`/api/screening/job/${jobId}/shortlist`);
      return { jobId, results: response.data.results };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch shortlist");
    }
  }
);

export const fetchOneResult = createAsyncThunk(
  "screening/fetchOneResult",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ScreeningResult>(`/api/screening/${id}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch screening result");
    }
  }
);

// ─── Slice ────────────────────────────────────

const screeningSlice = createSlice({
  name: "screening",
  initialState,
  reducers: {
    addLog(state, action: PayloadAction<string>) {
      state.log.push(action.payload);
    },
    clearLogs(state) {
      state.log = [];
    },
    clearError(state) {
      state.error = null;
    },
    resetScreeningState(state) {
      state.isScreening = false;
      state.screeningJobId = null;
      state.progress = 0;
      state.log = [];
      state.screenAllResult = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // screenAll
      .addCase(screenAll.pending, (state, action) => {
        state.isScreening = true;
        state.screeningJobId = action.meta.arg;
        state.error = null;
        state.log.push("Starting AI screening for all pending applicants...");
      })
      .addCase(screenAll.fulfilled, (state, action) => {
        state.isScreening = false;
        state.screenAllResult = action.payload;
        state.progress = 100;
        state.log.push(`Screening completed. Processed ${action.payload.totalScreened} applicants.`);
        if (action.payload.results?.length) {
          state.shortlists[action.payload.jobId] = action.payload.results;
        }
      })
      .addCase(screenAll.rejected, (state, action) => {
        state.isScreening = false;
        state.error = action.payload as string;
        state.log.push(`Screening failed: ${action.payload as string}`);
      })

      // fetchShortlist
      .addCase(fetchShortlist.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchShortlist.fulfilled, (state, action) => {
        const { jobId, results } = action.payload;
        state.shortlists[jobId] = results;
      })
      .addCase(fetchShortlist.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { addLog, clearLogs, clearError, resetScreeningState } = screeningSlice.actions;
export default screeningSlice.reducer;
