// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";
import "./index.css";
import { checkAuthStatus } from "./store/authSlice"; // 1. Import the thunk

// 2. Create an async function to run before render
const initializeApp = async () => {
  try {
    // 3. Dispatch the auth check and wait for it to complete
    await store.dispatch(checkAuthStatus()).unwrap();
  } catch (err) {
    // This catch block will run if checkAuthStatus is rejected
    // No action needed, the reducer already handled the logout state
    console.log("Not authenticated on load.");
  }

  // 4. Now render the app
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
};

// 5. Call the function
initializeApp();
