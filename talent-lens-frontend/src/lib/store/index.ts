import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "@/lib/slices/jobsSlice";
import applicantsReducer from "@/lib/slices/applicantsSlice";
import screeningReducer from "@/lib/slices/screeningSlice";
import uiReducer from "@/lib/slices/uiSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    applicants: applicantsReducer,
    screening: screeningReducer,
    ui: uiReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
