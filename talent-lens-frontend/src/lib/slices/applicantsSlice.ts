import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Applicant, ApplicantsState, ParsedApplicantRow } from "@/lib/types";
import api from "@/lib/api";

const initialState: ApplicantsState = {
  items: [],
  loading: false,
  error: null,
  parsedPreview: [],
};

// ─── Async Thunks ─────────────────────────────

export const fetchApplicantsByJob = createAsyncThunk(
  "applicants/fetchByJob",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Applicant[]>(`/api/applicants/job/${jobId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch applicants");
    }
  }
);

export const addUmuravaApplicant = createAsyncThunk(
  "applicants/addUmurava",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post<Applicant>("/api/applicants/umurava", data);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 409) {
         return rejectWithValue("This applicant has already been added to this job");
      }
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to add applicant");
    }
  }
);

// We need to use formData directly for external applicant due to the file
export const addExternalApplicant = createAsyncThunk(
  "applicants/addExternal",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      // Omit explicit Content-Type so Axios can auto-set the boundary for FormData
      const response = await api.post<Applicant>("/api/applicants/external", formData);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 409) {
         return rejectWithValue("This applicant has already been added to this job");
      }
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to upload applicant");
    }
  }
);

interface BulkUploadResponse {
  message: string;
  successfulUploads: number;
  failedUploads: number;
  results: Applicant[];
  errors: any[];
}

export const bulkUploadExternalApplicants = createAsyncThunk(
  "applicants/bulkExternal",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      // Omit explicit Content-Type so Axios can auto-set the boundary for FormData
      const response = await api.post<BulkUploadResponse>("/api/applicants/bulk-upload", formData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to bulk upload applicants");
    }
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
    clearParsedPreview(state) {
      state.parsedPreview = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchApplicantsByJob
      .addCase(fetchApplicantsByJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicantsByJob.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; // Usually returns all for job
      })
      .addCase(fetchApplicantsByJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // addUmuravaApplicant
      .addCase(addUmuravaApplicant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUmuravaApplicant.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addUmuravaApplicant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // addExternalApplicant
      .addCase(addExternalApplicant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExternalApplicant.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addExternalApplicant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // bulkUploadExternalApplicants
      .addCase(bulkUploadExternalApplicants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUploadExternalApplicants.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.results) {
          state.items.push(...action.payload.results);
        }
      })
      .addCase(bulkUploadExternalApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setParsedPreview, clearParsedPreview, clearError } = applicantsSlice.actions;
export default applicantsSlice.reducer;
