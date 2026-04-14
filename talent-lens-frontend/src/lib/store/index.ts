import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "@/lib/slices/jobsSlice";
import applicantsReducer from "@/lib/slices/applicantsSlice";
import screeningReducer from "@/lib/slices/screeningSlice";
import uiReducer from "@/lib/slices/uiSlice";
import profileReducer from "@/lib/slices/profileSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    applicants: applicantsReducer,
    screening: screeningReducer,
    ui: uiReducer,
    profile: profileReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
