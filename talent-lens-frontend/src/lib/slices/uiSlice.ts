import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "@/lib/types";

const initialState: UIState = {
  sidebarOpen: true,
  theme: "dark",
  searchTerm: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setSearchTerm } = uiSlice.actions;
export default uiSlice.reducer;
