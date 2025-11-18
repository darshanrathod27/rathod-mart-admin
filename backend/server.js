// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";

// routes
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productSizeMappingRoutes from "./routes/productSizeMappingRoutes.js";
import productColorMappingRoutes from "./routes/productColorMappingRoutes.js";
import variantMasterRoutes from "./routes/variantMasterRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import promocodeRoutes from "./routes/promocodeRoutes.js"; // <--- Ensure this imports the correct file

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

// ensure uploads folder served
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// basic routes
app.get("/health", (req, res) => res.json({ success: true, time: new Date() }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-size-mapping", productSizeMappingRoutes);
app.use("/api/product-color-mapping", productColorMappingRoutes);
app.use("/api/variant-master", variantMasterRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/promocodes", promocodeRoutes); // <--- Ensure this variable is 'promocodeRoutes'

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
