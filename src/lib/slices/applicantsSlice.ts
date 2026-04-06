import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ApplicantsState, ParsedApplicantRow } from "@/lib/types";
import api from "@/lib/utils/api";

const initialState: ApplicantsState = {
  items: [],
  loading: false,
  error: null,
  uploadProgress: 0,
  parsedPreview: [],
};

export const fetchApplicantsByJob = createAsyncThunk(
  "applicants/fetchByJob",
  async (jobId: string) => {
    const res = await api.get(`/applicants?jobId=${jobId}`);
    return res.data;
  }
);

export const uploadCSV = createAsyncThunk(
  "applicants/uploadCSV",
  async ({ jobId, file }: { jobId: string; file: File }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobId", jobId);
    const res = await api.post("/applicants/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
);

const applicantsSlice = createSlice({
  name: "applicants",
  initialState,
  reducers: {
    setParsedPreview(state, action: PayloadAction<ParsedApplicantRow[]>) {
      state.parsedPreview = action.payload;
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload;
    },
    clearParsedPreview(state) {
      state.parsedPreview = [];
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicantsByJob.pending, (state) => { state.loading = true; })
      .addCase(fetchApplicantsByJob.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApplicantsByJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch applicants";
      });
  },
});

export const { setParsedPreview, setUploadProgress, clearParsedPreview } =
  applicantsSlice.actions;
export default applicantsSlice.reducer;
