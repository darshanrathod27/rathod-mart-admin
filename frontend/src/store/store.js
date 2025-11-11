// frontend/src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other API slices or reducers here
  },
  devTools: process.env.NODE_ENV !== "production",
});
