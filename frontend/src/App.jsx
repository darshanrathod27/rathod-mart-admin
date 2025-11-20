// frontend/src/App.jsx
import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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
const PromocodeMaster = lazy(() => import("./pages/PromocodeMaster"));

// --- Protected Route Component ---
// Checks Redux state. If not authenticated, redirects to /login
function ProtectedRoute({ children }) {
  const { isAuthenticated, status } = useSelector((state) => state.auth);
  const location = useLocation();

  // While the app is checking auth status (on first load), show a loader
  // This prevents kicking the user out while the cookie check is pending
  if (status === "loading" || status === "idle") {
    return <div>Loading Authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
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
            style: { background: "#363636", color: "#fff" },
            success: { iconTheme: { primary: "#4CAF50", secondary: "#fff" } },
            error: { iconTheme: { primary: "#f44336", secondary: "#fff" } },
          }}
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to Users page */}
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
