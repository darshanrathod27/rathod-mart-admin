import express from "express";
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

// Apply protection middleware to all routes later
// router.use(protect);

router.route("/add-stock").post(addStock);
router.route("/reduce-stock").post(reduceStock);
router.route("/ledger").get(getInventoryLedger);
router.route("/product-variants/:productId").get(getProductVariants);
router.route("/stock-summary/:productId").get(getStockSummary);
router.route("/stats").get(getInventoryStats);

export default router;
