import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { corsOptions } from "./middleware/corsMiddleware.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productImageRoutes from "./routes/productImageRoutes.js";
import productSizeMappingRoutes from "./routes/productSizeMappingRoutes.js";
import productColorMappingRoutes from "./routes/productColorMappingRoutes.js";
import variantMasterRoutes from "./routes/variantMasterRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiter is temporarily disabled for development.
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
*/

// Static files for serving uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

// --- CORRECTED ROUTE MOUNTING ---
// Each router must be mounted in a separate app.use() call.
app.use("/api/products", productRoutes);
app.use("/api/products", productImageRoutes); // This now correctly handles image-related routes.

app.use("/api/product-size-mapping", productSizeMappingRoutes);
app.use("/api/product-color-mapping", productColorMappingRoutes);
app.use("/api/variant-master", variantMasterRoutes);
app.use("/api/inventory", inventoryRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (should be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
