import express from "express";
import {
  addStock,
  reduceStock,
  getInventoryLedger,
  getProductVariants,
  getStockSummary,
  getInventoryStats,
} from "../controllers/inventoryController.js";

const router = express.Router();

// Uncomment the line below and import protect when you have authentication
// import { protect } from "../middleware/authMiddleware.js";

// Public routes (no authentication required for now)
router.post("/add-stock", addStock);
router.post("/reduce-stock", reduceStock);
router.get("/ledger", getInventoryLedger);
router.get("/product-variants/:productId", getProductVariants);
router.get("/stock-summary/:productId", getStockSummary);
router.get("/stats", getInventoryStats);

// Protected routes (with authentication)
// router.post("/add-stock", protect, addStock);
// router.post("/reduce-stock", protect, reduceStock);
// router.get("/ledger", protect, getInventoryLedger);
// router.get("/product-variants/:productId", protect, getProductVariants);
// router.get("/stock-summary/:productId", protect, getStockSummary);
// router.get("/stats", protect, getInventoryStats);

export default router;
