import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// --- FIX 2: Import database connection ---
import connectDB from "./config/database.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productSizeMappingRoutes from "./routes/productSizeMappingRoutes.js";
import productColorMappingRoutes from "./routes/productColorMappingRoutes.js";
import variantMasterRoutes from "./routes/variantMasterRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

// Load environment variables
dotenv.config();

// --- FIX 2: Connect to the database ---
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);

// --- FIX 1: Correctly define __dirname ---
const __dirname = path.dirname(__filename);

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test routes
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    data: {
      server: "Rathod Mart Backend",
      version: "1.0.0",
    },
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-size-mapping", productSizeMappingRoutes);
app.use("/api/product-color-mapping", productColorMappingRoutes);
app.use("/api/variant-master", variantMasterRoutes);
app.use("/api/inventory", inventoryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
  console.log(`📊 Products: http://localhost:${PORT}/api/products`);
  console.log(`📂 Categories: http://localhost:${PORT}/api/categories`);
});
