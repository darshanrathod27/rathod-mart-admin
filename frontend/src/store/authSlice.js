// frontend/src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Check localStorage for existing user info
const initialState = {
  userInfo: localStorage.getItem("adminUserInfo")
    ? JSON.parse(localStorage.getItem("adminUserInfo"))
    : null,
  isAuthenticated: localStorage.getItem("adminUserInfo") ? true : false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action to set user info on login
    setCredentials(state, action) {
      state.userInfo = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("adminUserInfo", JSON.stringify(action.payload));
    },
    // Action to clear user info on logout
    logout(state) {
      state.userInfo = null;
      state.isAuthenticated = false;
      localStorage.removeItem("adminUserInfo");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
