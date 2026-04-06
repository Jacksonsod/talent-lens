import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ScreeningState, ShortlistResponse } from "@/lib/types";
import api from "@/lib/utils/api";

const initialState: ScreeningState = {
  results: {},
  isScreening: false,
  screeningJobId: null,
  progress: 0,
  log: [],
  error: null,
};

// ─── Async Thunks ─────────────────────────────

export const runScreening = createAsyncThunk(
  "screening/run",
  async (jobId: string, { dispatch }) => {
    dispatch(setScreeningJobId(jobId));
    dispatch(appendLog("Parsing job requirements..."));
    dispatch(setProgress(10));

    dispatch(appendLog("Loading applicant profiles into AI context..."));
    dispatch(setProgress(30));

    const res = await api.post<ShortlistResponse>(`/screening/run/${jobId}`);

    dispatch(appendLog("Ranking and scoring candidates..."));
    dispatch(setProgress(80));

    dispatch(appendLog("Generating AI reasoning per candidate..."));
    dispatch(setProgress(95));

    dispatch(appendLog(`Shortlist complete — ${res.data.shortlistCount} candidates selected.`));
    dispatch(setProgress(100));

    return res.data;
  }
);

export const fetchShortlist = createAsyncThunk(
  "screening/fetchShortlist",
  async (jobId: string) => {
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
        state.isScreening = false;
        state.screeningJobId = null;
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
