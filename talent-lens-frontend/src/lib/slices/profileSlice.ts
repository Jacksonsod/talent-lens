import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile, ProfileState } from "@/lib/types";

const STORAGE_KEY = "talentai_profile";

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  headline: "",
  bio: "",
  location: "",
  umuravaProfileId: "",
  skills: [],
  languages: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  availability: {
    status: "available",
    type: "Full-time",
    startDate: "",
  },
  socialLinks: {
    linkedin: "",
    github: "",
    portfolio: "",
  },
};

const loadFromStorage = (): UserProfile => {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return defaultProfile;
  }
};

const saveToStorage = (profile: UserProfile) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // silently fail — quota exceeded etc.
  }
};

const initialState: ProfileState = {
  data: defaultProfile,
  loaded: false,
  saving: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    loadProfile(state) {
      state.data = loadFromStorage();
      state.loaded = true;
    },
    updateProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      state.data = { ...state.data, ...action.payload };
      saveToStorage(state.data);
    },
    saveProfile(state) {
      state.saving = true;
      saveToStorage(state.data);
      state.saving = false;
    },
    resetProfile(state) {
      state.data = defaultProfile;
      saveToStorage(defaultProfile);
    },
  },
});

export const { loadProfile, updateProfile, saveProfile, resetProfile } =
  profileSlice.actions;
export default profileSlice.reducer;
