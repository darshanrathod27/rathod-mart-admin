// frontend/src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api"; // Import your api instance

// Check localStorage for existing user info
const initialState = {
  userInfo: localStorage.getItem("adminUserInfo")
    ? JSON.parse(localStorage.getItem("adminUserInfo"))
    : null,
  isAuthenticated: localStorage.getItem("adminUserInfo") ? true : false,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
};

// NEW: Async thunk to check auth status using the httpOnly cookie
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      // This endpoint is protected by 'protect' middleware on the backend
      const res = await api.get("/users/profile");
      return res.data; // This will be the user payload if successful
    } catch (err) {
      // If cookie is invalid or missing, backend returns 401
      return rejectWithValue(err.response?.data?.message || "Auth failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action to set user info on login
    setCredentials(state, action) {
      state.userInfo = action.payload;
      state.isAuthenticated = true;
      state.status = "succeeded";
      localStorage.setItem("adminUserInfo", JSON.stringify(action.payload));
    },
    // Action to clear user info on logout
    logout(state) {
      state.userInfo = null;
      state.isAuthenticated = false;
      state.status = "idle";
      localStorage.removeItem("adminUserInfo");
    },
  },
  // NEW: Handle the thunk's lifecycle
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        // Same as setCredentials
        state.userInfo = action.payload;
        state.isAuthenticated = true;
        state.status = "succeeded";
        localStorage.setItem("adminUserInfo", JSON.stringify(action.payload));
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        // Same as logout
        state.userInfo = null;
        state.isAuthenticated = false;
        state.status = "failed";
        localStorage.removeItem("adminUserInfo");
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
