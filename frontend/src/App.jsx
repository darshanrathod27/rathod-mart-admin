// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "react-hot-toast";
import { theme } from "./theme/theme";
// import { useAuth } from "./hooks/useAuth"; // 1. REMOVE
import { useSelector } from "react-redux"; // 2. ADD
import Login from "./pages/Login";
import Layout from "./components/Layout/Layout";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductSizeMapping from "./pages/ProductSizeMapping";
import ProductColorMapping from "./pages/ProductColorMapping";
import VariantMaster from "./pages/VariantMaster";
import InventoryMaster from "./pages/InventoryMaster";

// Protected Route Component
function ProtectedRoute({ children }) {
  // const { isAuthenticated } = useAuth(); // 3. REMOVE
  const { isAuthenticated } = useSelector((state) => state.auth); // 4. ADD
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4CAF50",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#f44336",
                secondary: "#fff",
              },
            },
          }}
        />
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route
              path="product-size-mapping"
              element={<ProductSizeMapping />}
            />
            <Route
              path="product-color-mapping"
              element={<ProductColorMapping />}
            />
            <Route path="variant-master" element={<VariantMaster />} />
            <Route path="inventory" element={<InventoryMaster />} />
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
