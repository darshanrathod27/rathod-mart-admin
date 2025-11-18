// frontend/src/App.jsx
import React, { lazy, Suspense } from "react";
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
import { useSelector } from "react-redux";
import Layout from "./components/Layout/Layout";
import Login from "./pages/Login";

// Lazy load pages
const Users = lazy(() => import("./pages/Users"));
const Categories = lazy(() => import("./pages/Categories"));
const Products = lazy(() => import("./pages/Products"));
const ProductSizeMapping = lazy(() => import("./pages/ProductSizeMapping"));
const ProductColorMapping = lazy(() => import("./pages/ProductColorMapping"));
const VariantMaster = lazy(() => import("./pages/VariantMaster"));
const InventoryMaster = lazy(() => import("./pages/InventoryMaster"));
// --- 1. ADD THIS IMPORT ---
const PromocodeMaster = lazy(() => import("./pages/PromocodeMaster"));

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
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
        <Suspense fallback={<div>Loading...</div>}>
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

              {/* --- 2. ADD THIS NEW ROUTE --- */}
              <Route path="promocodes" element={<PromocodeMaster />} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
