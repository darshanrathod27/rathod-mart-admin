// backend/routes/inventoryRoutes.js

import express from "express";
import { body } from "express-validator";
import {
  addStock,
  reduceStock,
  getInventoryLedger,
  getProductVariants,
  getStockSummary,
  getInventoryStats,
} from "../controllers/inventoryController.js";
// import { protect } from "../middleware/authMiddleware.js"; // Uncomment when auth is ready

const router = express.Router();

// Validation middleware
const stockValidation = [
  body("product", "Product ID is required").notEmpty().isMongoId(),
  body("quantity", "Quantity must be a positive number")
    .isFloat({ gt: 0 })
    .toFloat(),
  body("variant", "Invalid Variant ID").optional().isMongoId(),
];

// Public routes (for now) - apply 'protect' middleware when ready
router.post("/add-stock", stockValidation, addStock);
router.post("/reduce-stock", stockValidation, reduceStock);
router.get("/ledger", getInventoryLedger);
router.get("/product-variants/:productId", getProductVariants);
router.get("/stock-summary/:productId", getStockSummary);
router.get("/stats", getInventoryStats);

export default router;
