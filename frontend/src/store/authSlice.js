// frontend/src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api"; // Import your api instance

// Check localStorage for admin-specific user info
const initialState = {
  userInfo: localStorage.getItem("adminUserInfo")
    ? JSON.parse(localStorage.getItem("adminUserInfo"))
    : null,
  isAuthenticated: localStorage.getItem("adminUserInfo") ? true : false,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
};

// Async thunk to check auth status using the httpOnly cookie
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      // *** CHANGED: Call admin-profile endpoint ***
      const res = await api.get("/users/admin-profile");

      // Check if the user is an admin or manager
      if (res.data.role === "admin" || res.data.role === "manager") {
        return res.data;
      }
      return rejectWithValue("Not an admin or manager");
    } catch (err) {
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
  // Handle the thunk's lifecycle
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
