// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";
// import { AuthProvider } from "./hooks/useAuth"; // This is now removed
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <AuthProvider> <-- Remove this */}
      <App />
      {/* </AuthProvider> <-- Remove this */}
    </Provider>
  </React.StrictMode>
);
